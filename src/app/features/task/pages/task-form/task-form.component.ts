// task-form.component.ts
import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus } from '../../models/task.model';
import { RichTextEditorComponent } from '../../components/rich-text-editor/rich-text-editor.component';
import { futureDateValidator } from '../../../../shared/validators/deadline.validator';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RichTextEditorComponent],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css'
})
export class TaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  taskForm!: FormGroup;
  isEditMode = signal(false);
  taskId = signal<string | null>(null);
  
  // Signal to hold local error/toast messages
  errorMessage = signal<string | null>(null);

  private originalTask: Task | null = null;

  constructor() {
    const route = inject(ActivatedRoute);
    const idParam = route.snapshot.paramMap.get('id');
    if (idParam) {
      const taskSignal = this.taskService.getTaskById(idParam);
      effect(() => {
        const task = taskSignal();
        if (task) {
          this.populateForm(task);
        }
      });
    }
  }

  ngOnInit(): void {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      deadline: ['', [Validators.required, futureDateValidator()]],
      status: ['Pending', Validators.required]
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode.set(true);
      this.taskId.set(idParam);
      this.taskService.loadTasks();
    }
  }

  private populateForm(task: Task): void {
    this.originalTask = task;
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      status: task.status
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.taskForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    // Reset previous error messages
    this.errorMessage.set(null);

    // 1. Explicit Check: Validate description presence separately for custom message
    const descControl = this.taskForm.get('description');
    if (!descControl?.value || descControl.value.trim() === '') {
      this.errorMessage.set('Description is required!');
      this.taskForm.markAllAsTouched();
      return; // Stop submission
    }

    // 2. Fallback check for the rest of the form validation
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const { title, description, deadline, status } = this.taskForm.value;

    if (this.isEditMode()) {
      const id = this.taskId();
      if (id && this.originalTask) {
        const updatedTask: Task = {
          ...this.originalTask,
          title,
          description,
          deadline,
          status: status as TaskStatus
        };
        this.taskService.updateTask(updatedTask);
        this.router.navigate(['/tasks']);
      }
    } else {
      // 3. Dispatch and check if task already exists
      const isAdded = this.taskService.addTask(title, description, deadline, status as TaskStatus);

      if (isAdded) {
        // Success: Clear toast and navigate away
        this.router.navigate(['/tasks']);
      } else {
        // Duplicate Error: Stay on page, set error toast
        this.errorMessage.set(`A task with the title "${title}" already exists.`);
      }
    }
  }
}