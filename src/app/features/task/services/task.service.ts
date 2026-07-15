import { Injectable, Signal, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Task, TaskStatus } from '../models/task.model';
import * as TaskActions from '../store/task.actions';
import * as TaskSelectors from '../store/task.selectors';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private store = inject(Store);

  // Expose NgRx store selectors as Angular Signals
  readonly tasks: Signal<Task[]> = this.store.selectSignal(TaskSelectors.selectAllTasks);
  readonly loading: Signal<boolean> = this.store.selectSignal(TaskSelectors.selectTasksLoading);
  readonly error: Signal<string | null> = this.store.selectSignal(TaskSelectors.selectTasksError);

  constructor() {}

  loadTasks(): void {
    this.store.dispatch(TaskActions.loadTasks());
  }

  // addTask(title: string, description: string, deadline: string, status: TaskStatus): void {
  //   this.store.dispatch(TaskActions.addTask({ title, description, deadline, status }));
  // }

  // task.service.ts
  addTask(title: string, description: string, deadline: string, status: TaskStatus): boolean {
    const currentTasks = this.tasks();
    
    // Check for exact match (case-insensitive)
    const taskExists = currentTasks.some(
      (task) => task.title.trim().toLowerCase() === title.trim().toLowerCase()
    );

    if (!taskExists) {
      this.store.dispatch(TaskActions.addTask({ title, description, deadline, status }));
      return true; // Added successfully
    }

    return false; // Already exists!
  }

  updateTask(task: Task): void {
    this.store.dispatch(TaskActions.updateTask({ task }));
  }

  deleteTask(id: string): void {
    this.store.dispatch(TaskActions.deleteTask({ id }));
  }

  addComment(taskId: string, parentCommentId: string | null, author: string, content: string): void {
    this.store.dispatch(TaskActions.addComment({ taskId, parentCommentId, author, content }));
  }

  getTaskById(taskId: string): Signal<Task | null> {
    return this.store.selectSignal(TaskSelectors.selectTaskById(taskId));
  }
}
