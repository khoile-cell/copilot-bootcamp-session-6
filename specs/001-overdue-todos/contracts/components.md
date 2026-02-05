# Component Contracts: Support for Overdue Todo Items

**Feature**: 001-overdue-todos  
**Phase**: 1 (Design)  
**Date**: 2026-02-05

## Overview

This document defines the interface contracts for components modified or created for the overdue todos feature. Since this is a frontend-only feature, these are component prop interfaces rather than API endpoints.

---

## Component: TodoCard (Modified)

**File**: `packages/frontend/src/components/TodoCard.js`  
**Type**: Modified (existing component enhanced)  
**Purpose**: Display a single todo item with optional overdue styling

### Props Interface

```typescript
interface TodoCardProps {
  todo: {
    id: string;              // Required: Unique identifier
    title: string;           // Required: Task description
    dueDate: string | null;  // Optional: ISO 8601 date string
    completed: boolean;      // Required: Completion status
    createdAt: string;       // Required: ISO 8601 timestamp
    isOverdue: boolean;      // Required: Computed overdue status
  };
  onToggle: (id: string) => void;     // Required: Callback for completion toggle
  onDelete: (id: string) => void;     // Required: Callback for deletion
  onEdit?: (id: string) => void;      // Optional: Callback for editing
}
```

### Behavior

**Visual Rendering**:
- If `todo.isOverdue === true`:
  - Apply CSS class `todo-card--overdue`
  - Display clock icon with aria-label "Overdue"
  - Apply danger color border (from theme)
- If `todo.isOverdue === false`:
  - Standard styling (no overdue indicators)

**Accessibility**:
- Clock icon MUST have `aria-label="Overdue"` and `role="img"`
- Border color MUST meet WCAG AA contrast standards
- Card MUST remain keyboard navigable
- Focus indicators MUST be visible

**Example Usage**:
```javascript
<TodoCard
  todo={{
    id: '123',
    title: 'Review PR',
    dueDate: '2026-02-01',
    completed: false,
    createdAt: '2026-01-20T10:00:00Z',
    isOverdue: true
  }}
  onToggle={handleToggle}
  onDelete={handleDelete}
/>
```

**Styling Classes**:
- `.todo-card`: Base styling (existing)
- `.todo-card--overdue`: Overdue modifier (new)
  - Adds danger color border
  - Triggers icon display

---

## Component: TodoList (Modified)

**File**: `packages/frontend/src/components/TodoList.js`  
**Type**: Modified (existing component enhanced)  
**Purpose**: Display sorted and grouped list of todos

### Props Interface

```typescript
interface TodoListProps {
  todos: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    completed: boolean;
    createdAt: string;
  }>;
  onToggle: (id: string) => void;     // Callback for completion toggle
  onDelete: (id: string) => void;     // Callback for deletion
  onEdit?: (id: string) => void;      // Optional: Callback for editing
}
```

### Behavior

**Data Processing**:
1. Add `isOverdue` computed property to each todo
2. Sort todos using `sortTodos()` utility:
   - Overdue todos first (sorted by due date, oldest first)
   - Non-overdue todos second (sorted by creation date, newest first)
3. Render sorted array

**Performance**:
- Use `useMemo` to cache sorted todos (recompute only when `todos` prop changes)
- Target: <500ms render time for 100+ items

**Empty State**:
- If `todos.length === 0`, display: "No todos yet. Add one to get started! 👻"

**Example Usage**:
```javascript
<TodoList
  todos={todos}
  onToggle={handleToggle}
  onDelete={handleDelete}
/>
```

**Internal Logic**:
```javascript
const sortedTodos = useMemo(() => {
  const todosWithOverdue = todos.map(todo => ({
    ...todo,
    isOverdue: isOverdue(todo)
  }));
  return sortTodos(todosWithOverdue);
}, [todos]);
```

---

## Component: App (Modified)

**File**: `packages/frontend/src/App.js`  
**Type**: Modified (existing component enhanced)  
**Purpose**: Main application wrapper with header including overdue count

### State Interface

```typescript
interface AppState {
  todos: Array<Todo>;  // Array of todo objects from API
}
```

### Behavior

**Header Rendering**:
- Calculate `overdueCount = todos.filter(todo => isOverdue(todo)).length`
- Display in header:
  - If `overdueCount > 0`: "My Todos (X overdue)"
  - If `overdueCount === 0`: "My Todos" (no count shown)

**Performance**:
- Use `useMemo` to cache overdue count
- Recompute only when `todos` array changes

**Example Rendering**:
```javascript
function App() {
  const [todos, setTodos] = useState([]);
  
  const overdueCount = useMemo(
    () => todos.filter(todo => isOverdue(todo)).length,
    [todos]
  );
  
  return (
    <div className="app">
      <h1>
        My Todos {overdueCount > 0 && `(${overdueCount} overdue)`}
      </h1>
      <TodoList todos={todos} /* ... */ />
    </div>
  );
}
```

---

## Utility: dateUtils (New Module)

**File**: `packages/frontend/src/utils/dateUtils.js`  
**Type**: New module  
**Purpose**: Date comparison and overdue detection logic

### Functions

#### isOverdue()

**Signature**:
```typescript
function isOverdue(todo: Todo): boolean
```

**Parameters**:
- `todo`: Object with `dueDate` (string|null) and `completed` (boolean)

**Returns**:
- `true` if todo is overdue (has due date, incomplete, due date is before today)
- `false` otherwise

**Logic**:
```javascript
function isOverdue(todo) {
  if (!todo.dueDate || todo.completed) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(todo.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  return dueDate < today;
}
```

**Edge Cases**:
- `dueDate === null` → `false`
- `completed === true` → `false`
- `dueDate === today` → `false`
- Invalid date string → `false` (NaN comparison)

---

#### sortTodos()

**Signature**:
```typescript
function sortTodos(todos: Array<Todo & { isOverdue: boolean }>): Array<Todo>
```

**Parameters**:
- `todos`: Array of todo objects with `isOverdue` property

**Returns**:
- New sorted array (does not mutate input)

**Sorting Rules**:
1. Overdue todos before non-overdue todos
2. Within overdue group: sort by `dueDate` ascending (oldest first)
3. Within non-overdue group: sort by `createdAt` descending (newest first)

**Logic**:
```javascript
function sortTodos(todos) {
  return [...todos].sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) {
      return a.isOverdue ? -1 : 1;
    }
    
    if (a.isOverdue && b.isOverdue) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}
```

---

## CSS Contracts

### New/Modified Styles

**File**: `packages/frontend/src/App.css` or `packages/frontend/src/styles/theme.css`

#### .todo-card--overdue

```css
.todo-card--overdue {
  border: 2px solid var(--color-danger);
  /* --color-danger defined in theme:
     Light mode: #c62828
     Dark mode: #ef5350
  */
}
```

#### .overdue-indicator

```css
.overdue-indicator {
  display: inline-block;
  margin-right: 8px;
  font-size: 20px;
  /* Clock/calendar icon position */
}
```

---

## Data Flow Contract

### Component Hierarchy

```
App
├── Header (overdueCount displayed)
└── TodoList (receives todos, renders sorted)
    └── TodoCard[] (receives individual todo with isOverdue)
```

### Data Transformation Flow

```
API Data (todos array)
    ↓
App State (useState)
    ↓
TodoList (props: todos)
    ↓
useMemo: Add isOverdue property
    ↓
sortTodos() utility
    ↓
Sorted todos array
    ↓
TodoCard[] (props: todo with isOverdue)
    ↓
Conditional rendering (overdue styling)
```

---

## Error Handling

### Invalid Data Scenarios

| Scenario | Behavior | Rationale |
|----------|----------|-----------|
| `dueDate` is invalid date string | Treat as not overdue | Safe fallback, prevents crashes |
| `dueDate` is `null` | Treat as not overdue | Per spec: no due date = never overdue |
| `completed` is `undefined` | Treat as `false` (incomplete) | Conservative default |
| `todos` array is `null`/`undefined` | Render empty state | Graceful degradation |
| Network error on API call | Show existing todos or empty state | Handled by existing error logic |

### Accessibility Error States

- If clock icon fails to load: Border color still provides overdue indication
- If CSS fails to load: Semantic HTML still conveys structure
- Screen reader fallback: aria-label on icon ensures announcement

---

## Testing Contract

### Component Test Requirements

Each component MUST have tests covering:

**TodoCard**:
- Renders with overdue styling when `isOverdue === true`
- Renders without overdue styling when `isOverdue === false`
- Displays clock icon only when overdue
- Clock icon has correct aria-label
- Border applies danger theme color

**TodoList**:
- Sorts overdue todos before non-overdue todos
- Sorts overdue todos by due date (oldest first)
- Sorts non-overdue todos by creation date (newest first)
- Renders empty state when `todos.length === 0`
- Performance: renders 100 todos in <500ms

**App**:
- Displays overdue count in header when count > 0
- Hides overdue count when count === 0
- Updates count when todo is completed
- Updates count when todo is added/deleted

**dateUtils**:
- `isOverdue()` returns correct value for all edge cases
- `sortTodos()` produces correct sort order
- Performance: sorts 100 todos in <15ms

### Acceptance Test Mapping

See [../spec.md](../spec.md) for 18 acceptance scenarios that validate these contracts.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-05 | Initial contract definition |

---

## References

- Feature Spec: [spec.md](spec.md)
- Data Model: [data-model.md](data-model.md)
- Research: [research.md](research.md)
- UI Guidelines: [../../docs/ui-guidelines.md](../../docs/ui-guidelines.md)
