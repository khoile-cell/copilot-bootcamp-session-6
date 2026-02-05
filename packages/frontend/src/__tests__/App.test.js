import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-color-scheme: dark)' ? false : true,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock server to intercept API requests
const server = setupServer(
  rest.get('/api/todos', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 1, title: 'Learn React', dueDate: '2025-12-15', completed: 0, createdAt: '2025-11-01T00:00:00Z' },
        { id: 2, title: 'Build TODO app', dueDate: null, completed: 0, createdAt: '2025-11-02T00:00:00Z' }
      ])
    );
  }),

  rest.post('/api/todos', (req, res, ctx) => {
    const { title, dueDate } = req.body;
    
    if (!title || title.trim() === '') {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Todo title is required' })
      );
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        title,
        dueDate: dueDate || null,
        completed: 0,
        createdAt: new Date().toISOString()
      })
    );
  }),

  rest.put('/api/todos/:id', (req, res, ctx) => {
    const { title, dueDate } = req.body;
    
    if (!title || title.trim() === '') {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Todo title is required' })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        id: parseInt(req.params.id),
        title,
        dueDate: dueDate || null,
        completed: 0,
        createdAt: '2025-11-01T00:00:00Z'
      })
    );
  }),

  rest.patch('/api/todos/:id/toggle', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: parseInt(req.params.id),
        title: 'Test Todo',
        dueDate: null,
        completed: 1,
        createdAt: '2025-11-01T00:00:00Z'
      })
    );
  }),

  rest.delete('/api/todos/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ message: 'Todo deleted successfully', id: parseInt(req.params.id) })
    );
  })
);

// Setup and teardown for the mock server
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  localStorageMock.clear();
});
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the app header with title', async () => {
    render(<App />);
    expect(screen.getByText('My Todos')).toBeInTheDocument();
    expect(screen.getByText('🎃')).toBeInTheDocument();
  });

  test('loads and displays todos', async () => {
    render(<App />);

    expect(screen.getByText('Loading your todos...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Learn React')).toBeInTheDocument();
      expect(screen.getByText('Build TODO app')).toBeInTheDocument();
    });
  });

  test('creates a new todo', async () => {
    render(<App />);

    // Wait for the initial loading to complete and todos to load
    await waitFor(() => {
      expect(screen.queryByText('Loading your todos...')).not.toBeInTheDocument();
    });

    // Wait for the input to be enabled (no longer disabled during initial load)
    const titleInput = await screen.findByPlaceholderText('Add a new todo...');
    
    // Verify the button shows "Add Todo" (not "Adding...")
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /Add Todo/ });
      expect(addButton).not.toBeDisabled();
    });

    // Now fill in and submit the form
    fireEvent.change(titleInput, { target: { value: 'New Todo' } });

    const addButton = screen.getByRole('button', { name: /Add Todo/ });
    fireEvent.click(addButton);

    // Wait for the new todo to appear in the list
    await waitFor(() => {
      expect(screen.getByText('New Todo')).toBeInTheDocument();
    });
  });

  test('toggles todo completion status', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Learn React')).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });

  test('handles API error when fetching todos', async () => {
    server.use(
      rest.get('/api/todos', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load todos/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no todos', async () => {
    server.use(
      rest.get('/api/todos', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/No todos yet. Add one to get started!/)).toBeInTheDocument();
    });
  });

  test('toggles theme between light and dark', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
    });

    const themeToggle = screen.getByRole('button', { name: /Switch to dark mode/ });
    fireEvent.click(themeToggle);

    expect(localStorage.getItem('todoAppTheme')).toBe('dark');

    const themToggleAfter = screen.getByRole('button', { name: /Switch to light mode/ });
    fireEvent.click(themToggleAfter);
    expect(localStorage.getItem('todoAppTheme')).toBe('light');
  });

  // Tests for User Story 3: Overdue Count Summary
  describe('Overdue Count in Header', () => {
    test('displays overdue count when count is greater than 0', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      server.use(
        rest.get('/api/todos', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              { id: 1, title: 'Overdue 1', dueDate: yesterday.toISOString(), completed: 0, createdAt: '2025-11-01T00:00:00Z' },
              { id: 2, title: 'Overdue 2', dueDate: yesterday.toISOString(), completed: 0, createdAt: '2025-11-02T00:00:00Z' },
              { id: 3, title: 'Normal Todo', dueDate: null, completed: 0, createdAt: '2025-11-03T00:00:00Z' }
            ])
          );
        })
      );
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/2 overdue/i)).toBeInTheDocument();
      });
    });

    test('hides overdue count when no overdue todos', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      server.use(
        rest.get('/api/todos', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              { id: 1, title: 'Future Todo', dueDate: tomorrow.toISOString(), completed: 0, createdAt: '2025-11-01T00:00:00Z' },
              { id: 2, title: 'No Date Todo', dueDate: null, completed: 0, createdAt: '2025-11-02T00:00:00Z' }
            ])
          );
        })
      );
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Future Todo')).toBeInTheDocument();
      });
      
      // Should show just "My Todos" without overdue count
      expect(screen.getByText('My Todos')).toBeInTheDocument();
      expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
    });

    test('decreases overdue count when overdue todo is completed', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      server.use(
        rest.get('/api/todos', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              { id: 1, title: 'Past Due Task', dueDate: yesterday.toISOString(), completed: 0, createdAt: '2025-11-01T00:00:00Z' }
            ])
          );
        }),
        rest.patch('/api/todos/:id/toggle', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              id: parseInt(req.params.id),
              title: 'Past Due Task',
              dueDate: yesterday.toISOString(),
              completed: 1,
              createdAt: '2025-11-01T00:00:00Z'
            })
          );
        })
      );
      
      render(<App />);
      
      // Initially should show 1 overdue in header
      await waitFor(() => {
        expect(screen.getByText(/1 overdue/i)).toBeInTheDocument();
      });
      
      // Complete the todo
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      // Overdue count should disappear from header
      await waitFor(() => {
        const header = screen.getByRole('heading', { level: 1 });
        expect(header.textContent).not.toMatch(/\d+ overdue/i);
      });
    });

    test('increases overdue count when overdue todo is added', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      server.use(
        rest.get('/api/todos', (req, res, ctx) => {
          return res(ctx.status(200), ctx.json([]));
        }),
        rest.post('/api/todos', (req, res, ctx) => {
          return res(
            ctx.status(201),
            ctx.json({
              id: 1,
              title: 'New Overdue Todo',
              dueDate: yesterday.toISOString(),
              completed: 0,
              createdAt: new Date().toISOString()
            })
          );
        })
      );
      
      render(<App />);
      
      // Initially no overdue count
      await waitFor(() => {
        expect(screen.getByText(/No todos yet/)).toBeInTheDocument();
      });
      
      // Add an overdue todo
      const titleInput = screen.getByPlaceholderText('Add a new todo...');
      const dueDateInput = screen.getByLabelText(/Due date/i);
      const addButton = screen.getByRole('button', { name: /Add Todo/ });
      
      fireEvent.change(titleInput, { target: { value: 'New Overdue Todo' } });
      fireEvent.change(dueDateInput, { target: { value: yesterday.toISOString().split('T')[0] } });
      fireEvent.click(addButton);
      
      // Should show "(1 overdue)" in header
      await waitFor(() => {
        expect(screen.getByText(/1 overdue/i)).toBeInTheDocument();
      });
    });

    test('uses correct format "My Todos (X overdue)"', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      server.use(
        rest.get('/api/todos', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              { id: 1, title: 'Overdue 1', dueDate: yesterday.toISOString(), completed: 0, createdAt: '2025-11-01T00:00:00Z' },
              { id: 2, title: 'Overdue 2', dueDate: yesterday.toISOString(), completed: 0, createdAt: '2025-11-02T00:00:00Z' },
              { id: 3, title: 'Overdue 3', dueDate: yesterday.toISOString(), completed: 0, createdAt: '2025-11-03T00:00:00Z' }
            ])
          );
        })
      );
      
      render(<App />);
      
      await waitFor(() => {
        const header = screen.getByRole('heading', { level: 1 });
        expect(header.textContent).toMatch(/My Todos.*\(3 overdue\)/);
      });
    });
  });

  // Integration Tests: All Features Together
  describe('Integration: All Overdue Features', () => {
    test('all 3 features work together (visual + grouping + count)', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      server.use(
        rest.get('/api/todos', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              { id: 1, title: 'Normal Future', dueDate: tomorrow.toISOString(), completed: 0, createdAt: '2025-11-03T00:00:00Z' },
              { id: 2, title: 'Recent Overdue', dueDate: oneDayAgo.toISOString(), completed: 0, createdAt: '2025-11-02T00:00:00Z' },
              { id: 3, title: 'Old Overdue', dueDate: threeDaysAgo.toISOString(), completed: 0, createdAt: '2025-11-01T00:00:00Z' }
            ])
          );
        })
      );
      
      const { container } = render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Old Overdue')).toBeInTheDocument();
      });
      
      // Feature 3: Count shows 2 overdue
      expect(screen.getByText(/2 overdue/i)).toBeInTheDocument();
      
      // Feature 2: Grouping - overdue todos are first and sorted by oldest due date
      const cards = Array.from(container.querySelectorAll('.todo-card'));
      const titles = cards.map(card => card.querySelector('.todo-title')?.textContent || '');
      
      expect(titles[0]).toContain('Old Overdue'); // Oldest overdue first
      expect(titles[1]).toContain('Recent Overdue'); // Newer overdue second
      expect(titles[2]).toContain('Normal Future'); // Non-overdue last
      
      // Feature 1: Visual indicators on overdue todos
      expect(cards[0]).toHaveClass('todo-card--overdue');
      expect(cards[1]).toHaveClass('todo-card--overdue');
      expect(cards[2]).not.toHaveClass('todo-card--overdue');
      
      // Visual: Clock icon present on overdue
      const overdueIcons = screen.getAllByLabelText('Overdue');
      expect(overdueIcons).toHaveLength(2);
    });

    test('completing overdue todo updates visual, position, and count', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      server.use(
        rest.get('/api/todos', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              { id: 1, title: 'Overdue Task', dueDate: yesterday.toISOString(), completed: 0, createdAt: '2025-11-01T00:00:00Z' },
              { id: 2, title: 'Normal Task', dueDate: tomorrow.toISOString(), completed: 0, createdAt: '2025-11-02T00:00:00Z' }
            ])
          );
        }),
        rest.patch('/api/todos/:id/toggle', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              id: parseInt(req.params.id),
              title: 'Overdue Task',
              dueDate: yesterday.toISOString(),
              completed: 1,
              createdAt: '2025-11-01T00:00:00Z'
            })
          );
        })
      );
      
      const { container } = render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/1 overdue/i)).toBeInTheDocument();
      });
      
      // Verify overdue styling and position before completion
      let cards = Array.from(container.querySelectorAll('.todo-card'));
      expect(cards[0]).toHaveClass('todo-card--overdue');
      expect(cards[0].querySelector('.todo-title')?.textContent).toContain('Overdue Task');
      
      // Complete the overdue todo
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      
      await waitFor(() => {
        // Count should update to 0
        const header = screen.getByRole('heading', { level: 1 });
        expect(header.textContent).not.toMatch(/\d+ overdue/i);
      });
      
      // Visual styling should be removed
      cards = Array.from(container.querySelectorAll('.todo-card'));
      expect(cards[0]).not.toHaveClass('todo-card--overdue');
      expect(screen.queryByLabelText('Overdue')).not.toBeInTheDocument();
    });

    test('adding new overdue todo updates visual, position, and count', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      server.use(
        rest.get('/api/todos', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              { id: 1, title: 'Normal Task', dueDate: tomorrow.toISOString(), completed: 0, createdAt: '2025-11-01T00:00:00Z' }
            ])
          );
        }),
        rest.post('/api/todos', (req, res, ctx) => {
          return res(
            ctx.status(201),
            ctx.json({
              id: 2,
              title: 'New Overdue Task',
              dueDate: yesterday.toISOString(),
              completed: 0,
              createdAt: new Date().toISOString()
            })
          );
        })
      );
      
      const { container } = render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Normal Task')).toBeInTheDocument();
      });
      
      // Initially no overdue count
      let header = screen.getByRole('heading', { level: 1 });
      expect(header.textContent).not.toMatch(/overdue/i);
      
      // Add an overdue todo
      const titleInput = screen.getByPlaceholderText('Add a new todo...');
      const dueDateInput = screen.getByLabelText(/Due date/i);
      const addButton = screen.getByRole('button', { name: /Add Todo/ });
      
      fireEvent.change(titleInput, { target: { value: 'New Overdue Task' } });
      fireEvent.change(dueDateInput, { target: { value: yesterday.toISOString().split('T')[0] } });
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('New Overdue Task')).toBeInTheDocument();
      });
      
      // Count should update
      header = screen.getByRole('heading', { level: 1 });
      expect(header.textContent).toMatch(/1 overdue/i);
      
      // Visual styling should be present
      const cards = Array.from(container.querySelectorAll('.todo-card'));
      
      // Overdue todo should be first
      expect(cards[0].querySelector('.todo-title')?.textContent).toContain('New Overdue Task');
      expect(cards[0]).toHaveClass('todo-card--overdue');
      expect(screen.getByLabelText('Overdue')).toBeInTheDocument();
    });
  });
});