import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import * as TaskActions from './task.actions';
import { selectAllTasks } from './task.selectors';
import { Task } from '../models/task.model';

@Injectable()
export class TaskEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private store = inject(Store);

  private readonly STORAGE_KEY = 'tskmgr_tasks';

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.loadTasks),
      switchMap(() => {
        // Try local storage first
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          try {
            const tasks: Task[] = JSON.parse(stored);
            return of(TaskActions.loadTasksSuccess({ tasks }));
          } catch (e) {
            console.error('Failed to parse stored tasks, falling back to JSON file', e);
          }
        }

        // Fallback to HttpClient loading public/tasks.json
        return this.http.get<Task[]>('tasks.json').pipe(
          map(tasks => {
            // Save to localStorage for future reloads
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
            return TaskActions.loadTasksSuccess({ tasks });
          }),
          catchError(err =>
            of(TaskActions.loadTasksFailure({ error: err.message || 'Failed to load tasks.' }))
          )
        );
      })
    )
  );

  syncTasksToLocalStorage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          TaskActions.addTask,
          TaskActions.updateTask,
          TaskActions.deleteTask,
          TaskActions.addComment
        ),
        withLatestFrom(this.store.select(selectAllTasks)),
        tap(([_, tasks]) => {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
        })
      ),
    { dispatch: false }
  );
}
