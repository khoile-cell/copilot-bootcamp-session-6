import React from 'react';
import { render, screen } from '@testing-library/react';
import TodoList from '../TodoList';

describe('TodoList Component', () => {
  const mockHandlers = {
    onToggle: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn()
  };

  const mockTodos = [
    {
      id: 1,
      title: 'Todo 1',
      dueDate: '2025-12-25',
      completed: 0,
      createdAt: '2025-11-01T00:00:00Z'
    },
    {
      id: 2,
      title: 'Todo 2',
      dueDate: null,
      completed: 1,
      createdAt: '2025-11-02T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when todos array is empty', () => {
    render(<TodoList todos={[]} {...mockHandlers} isLoading={false} />);
    
    expect(screen.getByText(/No todos yet. Add one to get started!/)).toBeInTheDocument();
  });

  it('should render all todos when provided', () => {
    render(<TodoList todos={mockTodos} {...mockHandlers} isLoading={false} />);
    
    expect(screen.getByText('Todo 1')).toBeInTheDocument();
    expect(screen.getByText('Todo 2')).toBeInTheDocument();
  });

  it('should render correct number of todo cards', () => {
    const { container } = render(
      <TodoList todos={mockTodos} {...mockHandlers} isLoading={false} />
    );
    
    const cards = container.querySelectorAll('.todo-card');
    expect(cards).toHaveLength(2);
  });

  it('should pass handlers to TodoCard components', () => {
    render(<TodoList todos={mockTodos} {...mockHandlers} isLoading={false} />);
    
    // Verify that edit buttons exist for each todo
    expect(screen.getAllByLabelText(/Edit/)).toHaveLength(2);
    expect(screen.getAllByLabelText(/Delete/)).toHaveLength(2);
  });

  // Tests for User Story 2: Overdue Item Grouping
  describe('Overdue Grouping and Sorting', () => {
    it('should render overdue todos before non-overdue todos', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const mixedTodos = [
        { id: 1, title: 'Future Todo', dueDate: tomorrow.toISOString(), completed: 0, createdAt: '2024-01-01T10:00:00Z' },
        { id: 2, title: 'Overdue Todo', dueDate: yesterday.toISOString(), completed: 0, createdAt: '2024-01-02T10:00:00Z' },
        { id: 3, title: 'No Date Todo', dueDate: null, completed: 0, createdAt: '2024-01-03T10:00:00Z' }
      ];
      
      const { container } = render(
        <TodoList todos={mixedTodos} {...mockHandlers} isLoading={false} />
      );
      
      const cards = container.querySelectorAll('.todo-card');
      const titles = Array.from(cards).map(card => card.querySelector('.todo-title').textContent);
      
      // Overdue todo should be first
      expect(titles[0]).toContain('Overdue Todo');
    });

    it('should sort overdue todos by oldest due date first', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const overdueTodos = [
        { id: 1, title: 'One Day Overdue', dueDate: oneDayAgo.toISOString(), completed: 0, createdAt: '2024-01-01T10:00:00Z' },
        { id: 2, title: 'Three Days Overdue', dueDate: threeDaysAgo.toISOString(), completed: 0, createdAt: '2024-01-02T10:00:00Z' },
        { id: 3, title: 'Two Days Overdue', dueDate: twoDaysAgo.toISOString(), completed: 0, createdAt: '2024-01-03T10:00:00Z' }
      ];
      
      const { container } = render(
        <TodoList todos={overdueTodos} {...mockHandlers} isLoading={false} />
      );
      
      const cards = container.querySelectorAll('.todo-card');
      const titles = Array.from(cards).map(card => card.querySelector('.todo-title').textContent);
      
      // Should be sorted by oldest due date first
      expect(titles[0]).toContain('Three Days Overdue');
      expect(titles[1]).toContain('Two Days Overdue');
      expect(titles[2]).toContain('One Day Overdue');
    });

    it('should sort non-overdue todos by newest creation date first', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const normalTodos = [
        { id: 1, title: 'Oldest', dueDate: tomorrow.toISOString(), completed: 0, createdAt: '2024-01-01T10:00:00Z' },
        { id: 2, title: 'Newest', dueDate: tomorrow.toISOString(), completed: 0, createdAt: '2024-01-03T10:00:00Z' },
        { id: 3, title: 'Middle', dueDate: tomorrow.toISOString(), completed: 0, createdAt: '2024-01-02T10:00:00Z' }
      ];
      
      const { container } = render(
        <TodoList todos={normalTodos} {...mockHandlers} isLoading={false} />
      );
      
      const cards = container.querySelectorAll('.todo-card');
      const titles = Array.from(cards).map(card => card.querySelector('.todo-title').textContent);
      
      // Should be sorted by newest creation date first
      expect(titles[0]).toContain('Newest');
      expect(titles[1]).toContain('Middle');
      expect(titles[2]).toContain('Oldest');
    });

    it('should maintain normal order when no overdue todos exist', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const normalTodos = [
        { id: 1, title: 'Older Todo', dueDate: tomorrow.toISOString(), completed: 0, createdAt: '2024-01-01T10:00:00Z' },
        { id: 2, title: 'Newer Todo', dueDate: tomorrow.toISOString(), completed: 0, createdAt: '2024-01-02T10:00:00Z' }
      ];
      
      const { container } = render(
        <TodoList todos={normalTodos} {...mockHandlers} isLoading={false} />
      );
      
      const cards = container.querySelectorAll('.todo-card');
      expect(cards).toHaveLength(2);
      
      const titles = Array.from(cards).map(card => card.querySelector('.todo-title').textContent);
      // Should be sorted by newest creation date first when no overdue
      expect(titles[0]).toContain('Newer Todo');
      expect(titles[1]).toContain('Older Todo');
    });

    it('should remove completed overdue todo from overdue group', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const completedOverdueTodo = {
        id: 1,
        title: 'Completed Overdue',
        dueDate: yesterday.toISOString(),
        completed: 1,
        createdAt: '2024-01-01T10:00:00Z'
      };
      
      const normalTodo = {
        id: 2,
        title: 'Normal Todo',
        dueDate: null,
        completed: 0,
        createdAt: '2024-01-02T10:00:00Z'
      };
      
      const { container } = render(
        <TodoList todos={[completedOverdueTodo, normalTodo]} {...mockHandlers} isLoading={false} />
      );
      
      const cards = container.querySelectorAll('.todo-card');
      const firstCard = cards[0];
      
      // Completed overdue todo should not have overdue styling
      expect(firstCard).not.toHaveClass('todo-card--overdue');
    });

    it('should place new overdue todo in correct sort position', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const overdueTodos = [
        { id: 1, title: 'Three Days', dueDate: threeDaysAgo.toISOString(), completed: 0, createdAt: '2024-01-01T10:00:00Z' },
        { id: 2, title: 'Two Days', dueDate: twoDaysAgo.toISOString(), completed: 0, createdAt: '2024-01-02T10:00:00Z' }
      ];
      
      const { container } = render(
        <TodoList todos={overdueTodos} {...mockHandlers} isLoading={false} />
      );
      
      const cards = container.querySelectorAll('.todo-card');
      const titles = Array.from(cards).map(card => card.querySelector('.todo-title').textContent);
      
      // Verify correct sort order (oldest first)
      expect(titles[0]).toContain('Three Days');
      expect(titles[1]).toContain('Two Days');
    });
  });
});
