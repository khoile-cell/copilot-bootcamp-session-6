/**
 * Test suite for date utility functions
 * Tests for isOverdue() and sortTodos() functions
 * Following TDD approach - tests written BEFORE implementation
 */

import { isOverdue, sortTodos } from '../dateUtils';

describe('isOverdue', () => {
  test('returns false when todo has no due date', () => {
    const todo = {
      id: 1,
      text: 'No due date todo',
      completed: false,
      dueDate: null
    };
    expect(isOverdue(todo)).toBe(false);
  });

  test('returns false when todo is completed', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todo = {
      id: 2,
      text: 'Completed overdue todo',
      completed: true,
      dueDate: yesterday.toISOString()
    };
    expect(isOverdue(todo)).toBe(false);
  });

  test('returns true when incomplete todo is past due', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todo = {
      id: 3,
      text: 'Past due todo',
      completed: false,
      dueDate: yesterday.toISOString()
    };
    expect(isOverdue(todo)).toBe(true);
  });

  test('returns false when due date is today', () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const todo = {
      id: 4,
      text: 'Due today',
      completed: false,
      dueDate: today.toISOString()
    };
    expect(isOverdue(todo)).toBe(false);
  });

  test('returns false when due date is in future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todo = {
      id: 5,
      text: 'Future due date',
      completed: false,
      dueDate: tomorrow.toISOString()
    };
    expect(isOverdue(todo)).toBe(false);
  });
});

describe('sortTodos', () => {
  test('groups overdue todos before non-overdue', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todos = [
      { id: 1, text: 'Future', completed: false, dueDate: tomorrow.toISOString(), createdAt: '2024-01-01' },
      { id: 2, text: 'Overdue', completed: false, dueDate: yesterday.toISOString(), createdAt: '2024-01-02' },
      { id: 3, text: 'No date', completed: false, dueDate: null, createdAt: '2024-01-03' }
    ];
    
    const sorted = sortTodos(todos);
    expect(sorted[0].id).toBe(2); // Overdue should be first
  });

  test('sorts overdue by oldest due date first', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const todos = [
      { id: 1, text: 'One day old', completed: false, dueDate: oneDayAgo.toISOString(), createdAt: '2024-01-01' },
      { id: 2, text: 'Three days old', completed: false, dueDate: threeDaysAgo.toISOString(), createdAt: '2024-01-02' },
      { id: 3, text: 'Two days old', completed: false, dueDate: twoDaysAgo.toISOString(), createdAt: '2024-01-03' }
    ];
    
    const sorted = sortTodos(todos);
    expect(sorted[0].id).toBe(2); // Three days old (oldest) should be first
    expect(sorted[1].id).toBe(3); // Two days old should be second
    expect(sorted[2].id).toBe(1); // One day old should be third
  });

  test('sorts non-overdue by newest creation date first', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todos = [
      { id: 1, text: 'Oldest', completed: false, dueDate: tomorrow.toISOString(), createdAt: '2024-01-01T10:00:00Z' },
      { id: 2, text: 'Newest', completed: false, dueDate: tomorrow.toISOString(), createdAt: '2024-01-03T10:00:00Z' },
      { id: 3, text: 'Middle', completed: false, dueDate: tomorrow.toISOString(), createdAt: '2024-01-02T10:00:00Z' }
    ];
    
    const sorted = sortTodos(todos);
    expect(sorted[0].id).toBe(2); // Newest should be first
    expect(sorted[1].id).toBe(3); // Middle should be second
    expect(sorted[2].id).toBe(1); // Oldest should be third
  });
});
