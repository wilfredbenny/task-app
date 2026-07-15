import { Component, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Task } from '../../models/task.model';

interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.css'
})
export class CalendarViewComponent {
  tasks = input.required<Task[]>();
  currentDate = signal(new Date());

  private router = inject(Router);

  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Label for active Month & Year
  readonly monthYearLabel = computed(() => {
    return this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' });
  });

  // Calculate days for the calendar grid
  readonly calendarCells = computed<CalendarCell[]>(() => {
    const activeDate = this.currentDate();
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: CalendarCell[] = [];
    const today = new Date();

    // Helper to identify same calendar day
    const isSameDay = (d1: Date, d2: Date) => 
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    // 1. Previous month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      cells.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        tasks: this.getTasksForDate(date)
      });
    }

    // 2. Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const date = new Date(year, month, i);
      cells.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        tasks: this.getTasksForDate(date)
      });
    }

    // 3. Next month padding days to fill standard 6 weeks (42 cells)
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      cells.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        tasks: this.getTasksForDate(date)
      });
    }

    return cells;
  });

  private getTasksForDate(date: Date): Task[] {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    return this.tasks().filter(task => task.deadline === dateStr);
  }

  prevMonth(): void {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

  navigateToTask(taskId: string, event: MouseEvent): void {
    event.stopPropagation(); // Prevent trigger on date cell click
    this.router.navigate(['/tasks', taskId]);
  }
}
