import { createReducer, on } from '@ngrx/store';
import { Task, TaskComment } from '../models/task.model';
import * as TaskActions from './task.actions';

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export const initialTaskState: TaskState = {
  tasks: [],
  loading: false,
  error: null
};

// Helper: generate random IDs
function generateId(): string {
  return 'task-' + Math.random().toString(36).substring(2, 9);
}

function generateCommentId(): string {
  return 'comment-' + Math.random().toString(36).substring(2, 9);
}

// Recursive helper to insert a reply into comment trees
function insertReply(comments: TaskComment[], parentId: string, newComment: TaskComment): TaskComment[] {
  return comments.map(comment => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...comment.replies, newComment]
      };
    } else if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: insertReply(comment.replies, parentId, newComment)
      };
    }
    return comment;
  });
}

export const taskReducer = createReducer(
  initialTaskState,

  // Load Tasks
  on(TaskActions.loadTasks, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(TaskActions.loadTasksSuccess, (state, { tasks }) => ({
    ...state,
    loading: false,
    tasks
  })),
  on(TaskActions.loadTasksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Add Task
  on(TaskActions.addTask, (state, { title, description, deadline, status }) => {
    const newTask: Task = {
      id: generateId(),
      title,
      description,
      deadline,
      status,
      comments: []
    };
    return {
      ...state,
      tasks: [...state.tasks, newTask]
    };
  }),

  // Update Task
  on(TaskActions.updateTask, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map(t => (t.id === task.id ? task : t))
  })),

  // Delete Task
  on(TaskActions.deleteTask, (state, { id }) => ({
    ...state,
    tasks: state.tasks.filter(t => t.id !== id)
  })),

  // Add Comment / Reply
  on(TaskActions.addComment, (state, { taskId, parentCommentId, author, content }) => {
    const newComment: TaskComment = {
      id: generateCommentId(),
      author,
      content,
      timestamp: new Date().toISOString(),
      replies: []
    };

    return {
      ...state,
      tasks: state.tasks.map(task => {
        if (task.id !== taskId) return task;

        if (!parentCommentId) {
          // Root level comment
          return {
            ...task,
            comments: [...task.comments, newComment]
          };
        } else {
          // Nested reply
          return {
            ...task,
            comments: insertReply(task.comments, parentCommentId, newComment)
          };
        }
      })
    };
  })
);
