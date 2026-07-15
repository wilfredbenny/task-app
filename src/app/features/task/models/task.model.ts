export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface TaskComment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string; // ISO String
  replies: TaskComment[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  status: TaskStatus;
  comments: TaskComment[];
}
