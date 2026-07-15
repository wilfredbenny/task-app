import { createAction, props } from '@ngrx/store';
import { Task, TaskStatus } from '../models/task.model';

// Load Tasks
export const loadTasks = createAction('[Task] Load Tasks');
export const loadTasksSuccess = createAction(
  '[Task] Load Tasks Success',
  props<{ tasks: Task[] }>()
);
export const loadTasksFailure = createAction(
  '[Task] Load Tasks Failure',
  props<{ error: string }>()
);

// Create Task
export const addTask = createAction(
  '[Task] Add Task',
  props<{ title: string; description: string; deadline: string; status: TaskStatus }>()
);

// Update Task
export const updateTask = createAction(
  '[Task] Update Task',
  props<{ task: Task }>()
);

// Delete Task
export const deleteTask = createAction(
  '[Task] Delete Task',
  props<{ id: string }>()
);

// Comments & Replies
export const addComment = createAction(
  '[Task] Add Comment',
  props<{
    taskId: string;
    parentCommentId: string | null; // Null if root-level comment, otherwise ID of target comment
    author: string;
    content: string;
  }>()
);
