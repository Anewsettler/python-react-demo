import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TaskList from './TaskList';

const mockTasks = [
  {
    id: '1',
    clientId: 'client-1',
    title: 'Test Task 1',
    description: 'Description 1',
    status: 'todo' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    clientId: 'client-1',
    title: 'Test Task 2',
    description: 'Description 2',
    status: 'done' as const,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('TaskList', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders tasks successfully', async () => {
    // loads tasks and shows both items
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: mockTasks,
        nextCursor: null,
        hasMore: false,
      }),
    } as Response);

    render(<TaskList clientId="client-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    // shows loading when request is pending
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<TaskList clientId="client-1" />);
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('displays empty state when no tasks', async () => {
    // shows empty message when API returns no tasks
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [],
        nextCursor: null,
        hasMore: false,
      }),
    });

    render(<TaskList clientId="client-1" />);

    await waitFor(() => {
      expect(screen.getByText('No tasks yet. Create your first task above!')).toBeInTheDocument();
    });
  });

  it('creates a new task', async () => {
    // submits form and renders the created task
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [],
        nextCursor: null,
        hasMore: false,
      }),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '3',
        clientId: 'client-1',
        title: 'New Task',
        description: 'New Description',
        status: 'todo',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      }),
    });

    render(<TaskList clientId="client-1" />);

    await waitFor(() => {
      expect(screen.getByText('No tasks yet. Create your first task above!')).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText('Enter task title');
    const descInput = screen.getByPlaceholderText('Enter task description (optional)');
    const submitButton = screen.getByText('Create Task');

    fireEvent.change(titleInput, { target: { value: 'New Task' } });
    fireEvent.change(descInput, { target: { value: 'New Description' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('New Task')).toBeInTheDocument();
    });
  });

  it('filters tasks by status', async () => {
    // clicking Todo filter sends status=todo and refetches list
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: mockTasks,
        nextCursor: null,
        hasMore: false,
      }),
    });

    render(<TaskList clientId="client-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [mockTasks[0]],
        nextCursor: null,
        hasMore: false,
      }),
    });

    const todoButton = screen.getByRole('button', { name: /^Todo$/i });
    fireEvent.click(todoButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('status=todo'));
    });
  });

  it('loads more tasks when button clicked', async () => {
    // clicking Load More fetches next page and appends results
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [mockTasks[0]],
        nextCursor: 'cursor-1',
        hasMore: true,
      }),
    });

    render(<TaskList clientId="client-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [mockTasks[1]],
        nextCursor: null,
        hasMore: false,
      }),
    });

    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
  });
});