import { useState, useEffect, useRef, useCallback } from 'react';
import { Task, CreateTaskRequest, PaginatedTasksResponse } from '../types/task';

const API_BASE_URL = 'http://localhost:5000';

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
  
  const observer = useRef<IntersectionObserver>();
  const lastTaskRef = useCallback((node: HTMLLIElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreTasks();
      }
    });
    
    if (node) observer.current.observe(node);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasMore]);

  const fetchTasks = async (nextCursor?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE_URL}/api/tasks`);
      url.searchParams.append('client_id', clientId);
      url.searchParams.append('limit', '20');
      if (nextCursor) url.searchParams.append('cursor', nextCursor);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch tasks');
      
      const data: PaginatedTasksResponse = await res.json();
      
      setTasks(prev => nextCursor ? [...prev, ...data.items] : data.items);
      setCursor(data.nextCursor || null);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTasks = () => {
    if (cursor) fetchTasks(cursor);
  };

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

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
      setTasks(prev => prev.map(t => t.id === tempId ? created : t));
    } catch (err) {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Tasks for Client</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>Client ID: {clientId}</p>

      {error && (
        <div style={{ 
          color: '#c33', 
          background: '#fee', 
          padding: '12px', 
          marginBottom: '16px', 
          borderRadius: '4px',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ 
        marginBottom: '24px', 
        padding: '20px', 
        background: '#f9f9f9', 
        borderRadius: '8px' 
      }}>
        <h3 style={{ marginTop: 0 }}>Add New Task</h3>
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title *"
            required
            disabled={submitting}
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '16px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            disabled={submitting}
            rows={3}
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '16px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
        </div>
        <button 
          type="submit" 
          disabled={submitting || !title.trim()}
          style={{ 
            padding: '10px 24px', 
            fontSize: '16px', 
            background: submitting ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: submitting ? 'not-allowed' : 'pointer' 
          }}
        >
          {submitting ? 'Adding...' : 'Add Task'}
        </button>
      </form>

      {loading && tasks.length === 0 && <p>Loading tasks...</p>}

      {tasks.length === 0 && !loading ? (
        <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
          No tasks yet. Add one above!
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map((task, index) => (
            <li 
              key={task.id}
              ref={index === tasks.length - 1 ? lastTaskRef : null}
              style={{ 
                padding: '16px', 
                marginBottom: '12px', 
                background: 'white', 
                border: '1px solid #ddd', 
                borderRadius: '8px',
                opacity: task.id.startsWith('temp-') ? 0.6 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                {task.title}
              </h3>
              {task.description && (
                <p style={{ margin: '8px 0', color: '#555', fontSize: '14px' }}>
                  {task.description}
                </p>
              )}
              <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                <span>Status: {task.status}</span>
                <span style={{ margin: '0 8px' }}>•</span>
                <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {loading && tasks.length > 0 && (
        <p style={{ textAlign: 'center', color: '#666' }}>Loading more tasks...</p>
      )}
    </div>
  );
}