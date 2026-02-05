import React, { useMemo } from 'react';
import TodoCard from './TodoCard';
import { isOverdue, sortTodos } from '../utils/dateUtils';

function TodoList({ todos, onToggle, onEdit, onDelete, isLoading }) {
  // Compute isOverdue property and sort todos (overdue first, then by dates)
  const sortedTodos = useMemo(() => {
    // Add isOverdue property to each todo
    const todosWithOverdue = todos.map(todo => ({
      ...todo,
      isOverdue: isOverdue(todo)
    }));
    
    // Sort: overdue first (oldest due date), then non-overdue (newest creation date)
    return sortTodos(todosWithOverdue);
  }, [todos]);

  if (sortedTodos.length === 0) {
    return (
      <div className="todo-list empty-state">
        <p className="empty-state-message">
          No todos yet. Add one to get started! 👻
        </p>
      </div>
    );
  }

  return (
    <div className="todo-list">
      {sortedTodos.map((todo) => (
        <TodoCard
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}

export default TodoList;
