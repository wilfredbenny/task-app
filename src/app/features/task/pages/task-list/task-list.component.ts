import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus } from '../../models/task.model';
import { CalendarViewComponent } from '../../components/calendar-view/calendar-view.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CalendarViewComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent implements OnInit {
  taskService = inject(TaskService);

  searchQuery = signal('');
  selectedStatus = signal<'All' | TaskStatus>('All');
  viewMode = signal<'list' | 'calendar'>('list');

  readonly statusFilters: ('All' | TaskStatus)[] = ['All', 'Pending', 'In Progress', 'Completed'];

  // Signal computed value filtering our lists reactively
  readonly filteredTasks = computed(() => {
    const rawTasks = this.taskService.tasks();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();

    return rawTasks.filter(task => {
      const matchesStatus = status === 'All' || task.status === status;
      const matchesQuery = !query || 
        task.title.toLowerCase().includes(query) ||
        this.stripHtml(task.description).toLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    });
  });

  ngOnInit(): void {
    // Dispatch core state load on dashboard entry
    this.taskService.loadTasks();
  }

  deleteTask(id: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id);
    }
  }

  stripHtml(html: string): string {
    if (!html) return '';
    const cleanText = html.replace(/<[^>]*>/g, '');
    return cleanText;
  }

  // Count comments recursively
  countComments(task: Task): number {
    const countReplies = (list: any[]): number => {
      let count = list.length;
      for (const item of list) {
        if (item.replies && item.replies.length > 0) {
          count += countReplies(item.replies);
        }
      }
      return count;
    };
    return countReplies(task.comments);
  }
}
