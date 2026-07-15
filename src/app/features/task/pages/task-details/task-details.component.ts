import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { CommentSectionComponent } from '../../components/comment-section/comment-section.component';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [CommonModule, RouterLink, CommentSectionComponent],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.css'
})
export class TaskDetailsComponent implements OnInit {
  private taskService = inject(TaskService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  taskId = signal<string | null>(null);

  // Computed task fetching from routing parameters
  readonly task = computed(() => {
    const id = this.taskId();
    return id ? this.taskService.getTaskById(id)() : null;
  });

  ngOnInit(): void {
    // Sync store initial loading
    this.taskService.loadTasks();

    // Extract taskId from route path
    const idParam = this.route.snapshot.paramMap.get('id');
    this.taskId.set(idParam);
  }

  deleteTask(): void {
    const id = this.taskId();
    if (id && confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id);
      this.router.navigate(['/tasks']);
    }
  }
}
