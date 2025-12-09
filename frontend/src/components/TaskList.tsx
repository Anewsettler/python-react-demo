import { useState, useEffect } from 'react';
import { Task, CreateTaskRequest, PaginatedTasksResponse, TaskStatus } from '../types/task';
import './TaskList.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

interface TaskListProps {
  clientId: string;
}

export default function TaskList({ clientId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  // Fetch tasks with pagination and optional status filter
  const fetchTasks = async (nextCursor?: string | null, status?: TaskStatus | 'all') => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE_URL}/api/tasks`);
      url.searchParams.append('client_id', clientId);
      url.searchParams.append('limit', '10');
      if (nextCursor) url.searchParams.append('cursor', nextCursor);
      if (status && status !== 'all') url.searchParams.append('status', status);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch tasks');

      const data: PaginatedTasksResponse = await res.json();

      // Append when paginating; replace when fetching fresh
      setTasks(prev => (nextCursor ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor || null);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTasks = () => {
    if (cursor && hasMore && !loading) {
      fetchTasks(cursor, statusFilter);
    }
  };

  const handleFilterChange = (newStatus: TaskStatus | 'all') => {
    setStatusFilter(newStatus);
    setCursor(null);
    setHasMore(true);
    setTasks([]);
    fetchTasks(null, newStatus);
  };

  useEffect(() => {
    fetchTasks(null, statusFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Create task with optimistic UI update; rollback on error
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    
    if (!trimmedTitle) return;

    setSubmitting(true);
    setError(null);

    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();

    const tempTask: Task = {
      id: tempId,
      clientId,
      title: trimmedTitle,
      description: trimmedDesc || undefined,
      status: 'todo',
      createdAt: now,
      updatedAt: now,
    };

    setTasks(prev => [tempTask, ...prev]);
    setTitle('');
    setDescription('');

    try {
      const payload: CreateTaskRequest = {
        clientId,
        title: trimmedTitle,
        description: trimmedDesc || undefined,
      };

      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to create task');
      }

      const created: Task = await res.json();
      // Replace optimistic task with server version
      setTasks(prev => prev.map(t => t.id === tempId ? created : t));
    } catch (err) {
      // Rollback optimistic task on failure
      setTasks(prev => prev.filter(t => t.id !== tempId));
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="task-list-container">
      <h2 className="task-list-title">Tasks</h2>

      {error && (
        <div className="error-banner">
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-task-form">
        <h3 className="form-title">Create New Task</h3>
        <div className="form-group">
          <label className="form-label">
            Title <span className="form-required">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter task title"
            required
            disabled={submitting}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Enter task description (optional)"
            disabled={submitting}
            rows={3}
            className="form-textarea"
          />
        </div>
        <button type="submit" disabled={submitting || !title.trim()} className="submit-button">
          {submitting ? 'Creating...' : 'Create Task'}
        </button>
      </form>

      <div className="filter-container">
        <h3 className="task-count">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </h3>
        
        <div className="filter-controls">
          <label className="filter-label">Filter:</label>
          <div className="filter-buttons">
            <button
              onClick={() => handleFilterChange('all')}
              disabled={loading}
              className={`filter-button ${statusFilter === 'all' ? 'active-all' : ''}`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('todo')}
              disabled={loading}
              className={`filter-button ${statusFilter === 'todo' ? 'active-todo' : ''}`}
            >
              Todo
            </button>
            <button
              onClick={() => handleFilterChange('done')}
              disabled={loading}
              className={`filter-button ${statusFilter === 'done' ? 'active-done' : ''}`}
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="loading-state">
          <p>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">
            {statusFilter === 'all' 
              ? 'No tasks yet. Create your first task above!' 
              : `No ${statusFilter} tasks found.`}
          </p>
        </div>
      ) : (
        <>
          <ul className="task-list">
            {tasks.map((task) => (
              <li 
                key={task.id}
                className={`task-item ${task.id.startsWith('temp-') ? 'optimistic' : ''}`}
              >
                <div className="task-header">
                  <h3 className="task-title">{task.title}</h3>
                  <span className={`task-status-badge ${task.status}`}>
                    {task.status === 'done' ? 'Done' : 'Todo'}
                  </span>
                </div>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                <div className="task-footer">
                  Created {new Date(task.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="load-more-container">
              <button
                onClick={loadMoreTasks}
                disabled={loading}
                className="load-more-button"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {!hasMore && (
            <p className="end-of-list">End of list</p>
          )}
        </>
      )}
    </div>
  );
}