# Quickstart Guide: Overdue Todos Feature

**Feature**: 001-overdue-todos  
**Branch**: `001-overdue-todos`  
**Estimated Time**: 4-6 hours  
**Skill Level**: Intermediate React

## Overview

This guide helps you implement the overdue todos feature, which adds visual indicators, grouping, and count display for todos past their due date. The feature is frontend-only with no backend changes.

## Prerequisites

### Required Knowledge
- React hooks (useState, useMemo)
- Array methods (map, filter, sort)
- CSS theming and responsive design
- Jest and @testing-library/react

### Environment Setup
```bash
# Ensure you're on the feature branch
git checkout 001-overdue-todos

# Install dependencies (if not already installed)
npm install

# Verify tests run
npm test

# Start development server
npm start
```

### Read First
1. [Feature Spec](spec.md) - Understand requirements and success criteria
2. [Data Model](data-model.md) - Review data structures and state transitions
3. [Component Contracts](contracts/components.md) - Component interfaces

---

## Implementation Phases

### Phase 1: Create Utility Module (TDD Foundation)

**Estimated Time**: 30-45 minutes  
**Priority**: P1 (blocking for all features)

#### Step 1.1: Create Test File

```bash
mkdir -p packages/frontend/src/utils/__tests__
touch packages/frontend/src/utils/__tests__/dateUtils.test.js
```

**Write failing tests first** (TDD approach):

```javascript
// packages/frontend/src/utils/__tests__/dateUtils.test.js
import { isOverdue, sort Todos } from '../dateUtils';

describe('isOverdue', () => {
  // Mock current date to 2026-02-05 for consistent testing
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-05'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns false when todo has no due date', () => {
    const todo = { dueDate: null, completed: false };
    expect(isOverdue(todo)).toBe(false);
  });

  test('returns false when todo is completed', () => {
    const todo = { dueDate: '2026-01-01', completed: true };
    expect(isOverdue(todo)).toBe(false);
  });

  test('returns true when incomplete todo is past due', () => {
    const todo = { dueDate: '2026-02-01', completed: false };
    expect(isOverdue(todo)).toBe(true);
  });

  test('returns false when due date is today', () => {
    const todo = { dueDate: '2026-02-05', completed: false };
    expect(isOverdue(todo)).toBe(false);
  });

  test('returns false when due date is in future', () => {
    const todo = { dueDate: '2026-03-01', completed: false };
    expect(isOverdue(todo)).toBe(false);
  });
});

describe('sortTodos', () => {
  test('groups overdue todos before non-overdue todos', () => {
    const todos = [
      { id: '1', dueDate: '2026-03-01', completed: false, createdAt: '2026-01-01', isOverdue: false },
      { id: '2', dueDate: '2026-01-01', completed: false, createdAt: '2026-01-02', isOverdue: true }
    ];
    
    const sorted = sortTodos(todos);
    expect(sorted[0].id).toBe('2'); // Overdue first
    expect(sorted[1].id).toBe('1');
  });

  test('sorts overdue todos by oldest due date first', () => {
    const todos = [
      { id: '1', dueDate: '2026-01-20', completed: false, isOverdue: true },
      { id: '2', dueDate: '2026-01-10', completed: false, isOverdue: true }
    ];
    
    const sorted = sortTodos(todos);
    expect(sorted[0].id).toBe('2'); // Jan 10 before Jan 20
  });

  test('sorts non-overdue todos by newest creation date first', () => {
    const todos = [
      { id: '1', createdAt: '2026-01-10', isOverdue: false },
      { id: '2', createdAt: '2026-01-20', isOverdue: false }
    ];
    
    const sorted = sortTodos(todos);
    expect(sorted[0].id).toBe('2'); // Jan 20 before Jan 10
  });
});
```

**Run tests** (should fail):
```bash
npm test -- dateUtils.test.js
```

#### Step 1.2: Implement Utility Functions

```javascript
// packages/frontend/src/utils/dateUtils.js

/**
 * Determines if a todo is overdue
 * @param {Object} todo - Todo object with dueDate and completed properties
 * @returns {boolean} True if overdue
 */
export function isOverdue(todo) {
  if (!todo.dueDate || todo.completed) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(todo.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  return dueDate < today;
}

/**
 * Sorts todos with overdue items first (by oldest due date),
 * then non-overdue items (by newest creation date)
 * @param {Array} todos - Array of todo objects with isOverdue property
 * @returns {Array} Sorted array (new array, does not mutate)
 */
export function sortTodos(todos) {
  return [...todos].sort((a, b) => {
    // Overdue items always come first
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    
    // Both overdue: sort by due date (oldest first)
    if (a.isOverdue && b.isOverdue) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    
    // Neither overdue: sort by creation date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}
```

**Run tests** (should pass):
```bash
npm test -- dateUtils.test.js
```

**Verification**: ✅ All tests pass, coverage >80% for dateUtils.js

---

### Phase 2: Modify TodoList Component (P2 Feature)

**Estimated Time**: 45-60 minutes  
**Priority**: P2 (grouping and sorting)

#### Step 2.1: Write TodoList Tests

```javascript
// packages/frontend/src/components/__tests__/TodoList.test.js
import { render, screen } from '@testing-library/react';
import TodoList from '../TodoList';

describe('TodoList - Overdue Grouping', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-05'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders overdue todos before non-overdue todos', () => {
    const todos = [
      { id: '1', title: 'Future Todo', dueDate: '2026-03-01', completed: false, createdAt: '2026-01-01' },
      { id: '2', title: 'Overdue Todo', dueDate: '2026-01-01', completed: false, createdAt: '2026-01-02' }
    ];

    render(<TodoList todos={todos} onToggle={jest.fn()} onDelete={jest.fn()} />);
    
    const todoCards = screen.getAllByRole('article'); // Assuming TodoCard has role="article"
    expect(todoCards[0]).toHaveTextContent('Overdue Todo');
    expect(todoCards[1]).toHaveTextContent('Future Todo');
  });

  test('sorts overdue todos by oldest due date first', () => {
    const todos = [
      { id: '1', title: 'Overdue Recent', dueDate: '2026-01-20', completed: false, createdAt: '2026-01-01' },
      { id: '2', title: 'Overdue Old', dueDate: '2026-01-10', completed: false, createdAt: '2026-01-02' }
    ];

    render(<TodoList todos={todos} onToggle={jest.fn()} onDelete={jest.fn()} />);
    
    const todoCards = screen.getAllByRole('article');
    expect(todoCards[0]).toHaveTextContent('Overdue Old');
  });
});
```

**Run tests** (should fail):
```bash
npm test -- TodoList.test.js
```

#### Step 2.2: Modify TodoList Component

```javascript
// packages/frontend/src/components/TodoList.js
import React, { useMemo } from 'react';
import TodoCard from './TodoCard';
import { isOverdue, sortTodos } from '../utils/dateUtils';

function TodoList({ todos, onToggle, onDelete, onEdit }) {
  // Add isOverdue property and sort
  const sortedTodos = useMemo(() => {
    const todosWithOverdue = todos.map(todo => ({
      ...todo,
      isOverdue: isOverdue(todo)
    }));
    return sortTodos(todosWithOverdue);
  }, [todos]);

  if (sortedTodos.length === 0) {
    return <div className="empty-state">No todos yet. Add one to get started! 👻</div>;
  }

  return (
    <div className="todo-list">
      {sortedTodos.map(todo => (
        <TodoCard
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

export default TodoList;
```

**Run tests** (should pass):
```bash
npm test -- TodoList.test.js
```

---

### Phase 3: Modify TodoCard Component (P1 Feature)

**Estimated Time**: 45-60 minutes  
**Priority**: P1 (visual indicators)

#### Step 3.1: Write TodoCard Tests

```javascript
// packages/frontend/src/components/__tests__/TodoCard.test.js
import { render, screen } from '@testing-library/react';
import TodoCard from '../TodoCard';

describe('TodoCard - Overdue Styling', () => {
  test('applies overdue styling when isOverdue is true', () => {
    const todo = {
      id: '1',
      title: 'Overdue Task',
      dueDate: '2026-01-01',
      completed: false,
      createdAt: '2026-01-01',
      isOverdue: true
    };

    const { container } = render(
      <TodoCard todo={todo} onToggle={jest.fn()} onDelete={jest.fn()} />
    );

    const card = container.querySelector('.todo-card');
    expect(card).toHaveClass('todo-card--overdue');
  });

  test('displays clock icon when overdue', () => {
    const todo = {
      id: '1',
      title: 'Overdue Task',
      dueDate: '2026-01-01',
      completed: false,
      createdAt: '2026-01-01',
      isOverdue: true
    };

    render(<TodoCard todo={todo} onToggle={jest.fn()} onDelete={jest.fn()} />);
    
    const icon = screen.getByLabelText('Overdue');
    expect(icon).toBeInTheDocument();
  });

  test('does not apply overdue styling when isOverdue is false', () => {
    const todo = {
      id: '1',
      title: 'Normal Task',
      dueDate: '2026-03-01',
      completed: false,
      createdAt: '2026-01-01',
      isOverdue: false
    };

    const { container } = render(
      <TodoCard todo={todo} onToggle={jest.fn()} onDelete={jest.fn()} />
    );

    const card = container.querySelector('.todo-card');
    expect(card).not.toHaveClass('todo-card--overdue');
    expect(screen.queryByLabelText('Overdue')).not.toBeInTheDocument();
  });
});
```

**Run tests** (should fail):
```bash
npm test -- TodoCard.test.js
```

#### Step 3.2: Modify TodoCard Component

```javascript
// packages/frontend/src/components/TodoCard.js
import React from 'react';
import './TodoCard.css';

function TodoCard({ todo, onToggle, onDelete, onEdit }) {
  const cardClassName = todo.isOverdue 
    ? 'todo-card todo-card--overdue' 
    : 'todo-card';

  return (
    <article className={cardClassName} role="article">
      {todo.isOverdue && (
        <span className="overdue-indicator" aria-label="Overdue" role="img">
          🕐
        </span>
      )}
      
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`Mark ${todo.title} as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      
      <div className="todo-content">
        <h3>{todo.title}</h3>
        {todo.dueDate && (
          <span className="due-date">Due: {new Date(todo.dueDate).toLocaleDateString()}</span>
        )}
      </div>
      
      <div className="todo-actions">
        {onEdit && <button onClick={() => onEdit(todo.id)}>Edit</button>}
        <button onClick={() => onDelete(todo.id)}>Delete</button>
      </div>
    </article>
  );
}

export default TodoCard;
```

#### Step 3.3: Add CSS Styles

```css
/* packages/frontend/src/components/TodoCard.css or App.css */

.todo-card--overdue {
  border: 2px solid var(--color-danger);
}

.overdue-indicator {
  display: inline-block;
  margin-right: 8px;
  font-size: 20px;
  vertical-align: middle;
}

/* Ensure theme colors are defined */
:root {
  --color-danger: #c62828; /* Light mode */
}

[data-theme="dark"] {
  --color-danger: #ef5350; /* Dark mode */
}
```

**Run tests** (should pass):
```bash
npm test -- TodoCard.test.js
```

---

### Phase 4: Modify App Component (P3 Feature)

**Estimated Time**: 30-45 minutes  
**Priority**: P3 (overdue count)

#### Step 4.1: Write App Tests

```javascript
// packages/frontend/src/__tests__/App.test.js
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App - Overdue Count', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-05'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('displays overdue count in header when count > 0', async () => {
    // Mock API response with overdue todos
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([
          { id: '1', title: 'Overdue 1', dueDate: '2026-01-01', completed: false, createdAt: '2026-01-01' },
          { id: '2', title: 'Overdue 2', dueDate: '2026-01-15', completed: false, createdAt: '2026-01-02' }
        ])
      })
    );

    render(<App />);
    
    // Wait for async load
    const header = await screen.findByRole('heading', { level: 1 });
    expect(header).toHaveTextContent('My Todos (2 overdue)');
  });

  test('hides overdue count when count is 0', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([
          { id: '1', title: 'Future', dueDate: '2026-03-01', completed: false, createdAt: '2026-01-01' }
        ])
      })
    );

    render(<App />);
    
    const header = await screen.findByRole('heading', { level: 1 });
    expect(header).toHaveTextContent('My Todos');
    expect(header).not.toHaveTextContent('overdue');
  });
});
```

**Run tests** (should fail):
```bash
npm test -- App.test.js
```

#### Step 4.2: Modify App Component

```javascript
// packages/frontend/src/App.js
import React, { useState, useMemo, useEffect } from 'react';
import TodoList from './components/TodoList';
import { isOverdue } from './utils/dateUtils';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);

  // Calculate overdue count
  const overdueCount = useMemo(
    () => todos.filter(todo => isOverdue(todo)).length,
    [todos]
  );

  // Fetch todos on mount (existing logic)
  useEffect(() => {
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => setTodos(data))
      .catch(err => console.error('Failed to fetch todos:', err));
  }, []);

  const handleToggle = (id) => {
    // Existing toggle logic...
  };

  const handleDelete = (id) => {
    // Existing delete logic...
  };

  return (
    <div className="app">
      <header>
        <h1>
          My Todos {overdueCount > 0 && `(${overdueCount} overdue)`}
        </h1>
      </header>
      
      <main>
        <TodoList
          todos={todos}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}

export default App;
```

**Run tests** (should pass):
```bash
npm test -- App.test.js
```

---

## Verification Checklist

### Functional Testing

Run the app and verify:

- [ ] Overdue todos display with danger color border
- [ ] Overdue todos display clock icon (🕐)
- [ ] Overdue todos appear at top of list
- [ ] Overdue todos are sorted by oldest due date first
- [ ] Non-overdue todos sorted by newest creation date
- [ ] Overdue count appears in header (e.g., "My Todos (3 overdue)")
- [ ] Count updates when todo is completed/deleted/added
- [ ] Completed todos with past due dates are NOT marked overdue
- [ ] Todos due today are NOT marked overdue
- [ ] Todos without due dates are never overdue

### Accessibility Testing

- [ ] Clock icon has `aria-label="Overdue"`
- [ ] Border color meets WCAG AA contrast (use browser dev tools)
- [ ] All todos remain keyboard navigable (Tab key)
- [ ] Screen reader announces "Overdue" for overdue items
- [ ] Focus indicators visible on all interactive elements

### Performance Testing

```bash
# Run performance test with 100 todos
npm test -- --testNamePattern="performance"
```

- [ ] Render 100 todos in <500ms
- [ ] Sort operation completes in <15ms
- [ ] No console warnings or errors

### Code Quality

```bash
# Run all tests with coverage
npm test -- --coverage
```

- [ ] All tests pass (18+ test cases)
- [ ] Coverage >80% for modified files
- [ ] No ESLint errors or warnings
- [ ] Code follows naming conventions (camelCase, PascalCase)

---

## Common Issues & Troubleshooting

### Issue: Overdue styling not applying

**Symptoms**: Border and icon not showing for past-due todos

**Solutions**:
1. Verify `isOverdue` property is being added in TodoList
2. Check CSS class name matches: `.todo-card--overdue`
3. Ensure theme colors are defined in CSS
4. Verify todo has both `dueDate` and `completed: false`

### Issue: Sorting not working correctly

**Symptoms**: Overdue todos not appearing first

**Solutions**:
1. Verify `sortTodos` is being called in TodoList
2. Check that `isOverdue` is computed before sorting
3. Ensure `useMemo` dependency array includes `todos`
4. Debug with `console.log(sortedTodos)` to inspect order

### Issue: Overdue count incorrect

**Symptoms**: Header shows wrong count

**Solutions**:
1. Verify `isOverdue` function logic (check date comparison)
2. Ensure filter is using correct predicate
3. Check that `useMemo` recomputes when `todos` changes
4. Mock system date in tests for consistency

### Issue: Tests failing with date-related errors

**Symptoms**: "Date is not defined" or wrong overdue status in tests

**Solutions**:
```javascript
// Always mock dates in tests
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-02-05'));
});

afterEach(() => {
  jest.useRealTimers();
});
```

---

## Performance Optimization Tips

### If rendering is slow:

1. **Verify useMemo is used**:
   ```javascript
   const sortedTodos = useMemo(() => {
     // sorting logic
   }, [todos]);
   ```

2. **Profile with React DevTools**:
   - Open React DevTools → Profiler
   - Record interaction
   - Look for unnecessary re-renders

3. **Check array size**:
   - Feature is optimized for ~100 todos
   - If you have 1000+, consider pagination (out of scope for this feature)

---

## Deployment Checklist

Before opening PR:

- [ ] All tests pass locally
- [ ] Coverage report shows >80%
- [ ] Manual testing complete (all scenarios)
- [ ] Accessibility validation passed
- [ ] No console errors or warnings
- [ ] Code follows project conventions
- [ ] Commit messages are descriptive
- [ ] Branch is up to date with main

```bash
# Final validation
npm test -- --coverage
npm run lint
npm start  # Manual smoke test
```

---

##Next Steps

After this feature is complete:

1. **Code Review**: Open PR for team review
2. **User Acceptance Testing**: Share with stakeholders
3. **Performance Monitoring**: Track render times in production
4. **Future Enhancements** (out of scope):
   - Filter to show only overdue items
   - Notifications when todo becomes overdue
   - Custom overdue visual preferences

---

## Support & Resources

- **Spec Questions**: See [spec.md](spec.md)
- **Architecture Questions**: See [data-model.md](data-model.md)
- **Component Interfaces**: See [contracts/components.md](contracts/components.md)
- **Research Decisions**: See [research.md](research.md)
- **Constitution**: [../../.specify/memory/constitution.md](../../.specify/memory/constitution.md)

**Estimated Total Time**: 4-6 hours (including testing)

Happy coding! 🎃
