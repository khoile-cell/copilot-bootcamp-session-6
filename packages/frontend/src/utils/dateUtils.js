/**
 * Date utility functions for todo management
 * Provides date comparison and sorting functionality for overdue detection
 */

/**
 * Determines if a todo item is overdue
 * 
 * A todo is considered overdue if:
 * - It has a due date
 * - It is not completed
 * - The due date is before the start of today
 * 
 * @param {Object} todo - The todo item to check
 * @param {string|null} todo.dueDate - ISO 8601 date string or null
 * @param {boolean} todo.completed - Whether the todo is completed
 * @returns {boolean} True if the todo is overdue, false otherwise
 * 
 * @example
 * isOverdue({ dueDate: '2024-01-01', completed: false }) // true (if today is after 2024-01-01)
 * isOverdue({ dueDate: '2024-01-01', completed: true }) // false
 * isOverdue({ dueDate: null, completed: false }) // false
 */
export function isOverdue(todo) {
  // No due date means not overdue
  if (!todo.dueDate) {
    return false;
  }

  // Completed todos are never overdue
  if (todo.completed) {
    return false;
  }

  // Compare dates at midnight (start of day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(todo.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  // Overdue if due date is before today
  return dueDate < today;
}

/**
 * Sorts todos with overdue items first, then by appropriate date fields
 * 
 * Sorting logic:
 * - Overdue todos come before non-overdue todos
 * - Within overdue: Sort by oldest due date first (ascending)
 * - Within non-overdue: Sort by newest creation date first (descending)
 * 
 * @param {Array<Object>} todos - Array of todo items to sort
 * @param {string|null} todos[].dueDate - ISO 8601 date string or null
 * @param {boolean} todos[].completed - Whether the todo is completed
 * @param {string} todos[].createdAt - ISO 8601 creation date string
 * @returns {Array<Object>} New sorted array (does not mutate original)
 * 
 * @example
 * const todos = [
 *   { id: 1, dueDate: '2024-12-01', completed: false, createdAt: '2024-01-01' },
 *   { id: 2, dueDate: '2024-12-15', completed: false, createdAt: '2024-01-02' }
 * ];
 * const sorted = sortTodos(todos);
 */
export function sortTodos(todos) {
  // Create a shallow copy to avoid mutating the original array
  return [...todos].sort((a, b) => {
    const aOverdue = isOverdue(a);
    const bOverdue = isOverdue(b);

    // Group overdue todos before non-overdue
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Both overdue: sort by oldest due date first (ascending)
    if (aOverdue && bOverdue) {
      const aDate = new Date(a.dueDate);
      const bDate = new Date(b.dueDate);
      return aDate - bDate; // Ascending (oldest first)
    }

    // Both non-overdue: sort by newest creation date first (descending)
    const aCreated = new Date(a.createdAt);
    const bCreated = new Date(b.createdAt);
    return bCreated - aCreated; // Descending (newest first)
  });
}
