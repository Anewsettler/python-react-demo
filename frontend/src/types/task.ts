export type TaskStatus = 'todo' | 'done';

export interface Task {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  externalId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  clientId: string;
  title: string;
  description?: string;
  dueDate?: string;
  externalId?: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface PaginatedTasksResponse {
  items: Task[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface OverdueCount {
  clientId: string;
  overdueCount: number;
}