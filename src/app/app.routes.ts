import { Routes } from '@angular/router';
import { TaskListComponent } from './features/task/pages/task-list/task-list.component';
import { TaskDetailsComponent } from './features/task/pages/task-details/task-details.component';
import { TaskFormComponent } from './features/task/pages/task-form/task-form.component';

export const routes: Routes = [
  { path: 'tasks', component: TaskListComponent },
  { path: 'tasks/new', component: TaskFormComponent },
  { path: 'tasks/:id', component: TaskDetailsComponent },
  { path: 'tasks/:id/edit', component: TaskFormComponent },
  { path: '', redirectTo: '/tasks', pathMatch: 'full' },
  { path: '**', redirectTo: '/tasks' }
];
