# Data Model: Support for Overdue Todo Items

**Feature**: 001-overdue-todos  
**Phase**: 1 (Design)  
**Date**: 2026-02-05

## Overview

This feature extends the existing Todo entity with computed overdue status. No database schema changes required. All data structures are frontend representations.

## Entities

### Todo Item (Enhanced)

The existing Todo entity with an additional computed property.

**Source**: Backend API (existing)  
**Frontend Representation**: JavaScript object with computed `isOverdue` property

```typescript
interface Todo {
  // Existing properties (from backend)
  id: string;              // Unique identifier
  title: string;           // Task description (max 255 chars)
  dueDate: string | null;  // ISO 8601 date string (optional)
  completed: boolean;      // Completion status
  createdAt: string;       // ISO 8601 timestamp
  
  // Computed property (frontend only, not persisted)
  isOverdue: boolean;      // Derived from dueDate, completed, and current date
}
```

**Validation Rules** (existing, unchanged):
- `id`: Required, non-empty string
- `title`: Required, non-empty, max 255 characters
- `dueDate`: Optional, must be valid ISO 8601 date if present
- `completed`: Required, boolean
- `createdAt`: Required, valid ISO 8601 timestamp

**Overdue Computation Rules** (new):
```javascript
isOverdue = (
  dueDate !== null &&
  completed === false &&
  new Date(dueDate) < startOfToday()
)
```

Where `startOfToday()` returns current date with time set to 00:00:00.000 local time.

---

## State Transitions

### Overdue Status State Machine

```
┌─────────────┐
│   Created   │
│  (New Todo) │
└──────┬──────┘
       │
       ├─── Has dueDate? ───┐
       │                    │
       NO                  YES
       │                    │
       ▼                    ▼
┌──────────────┐    ┌──────────────┐
│ Never Overdue│    │  Evaluatable │
│ (no dueDate) │    │  (has date)  │
└──────────────┘    └──────┬───────┘
                            │
                    Current Date >= Due Date?
                            │
                    ┌───────┴───────┐
                   YES              NO
                    │                │
                    ▼                ▼
            ┌──────────────┐  ┌──────────────┐
            │   OVERDUE    │  │ Not Overdue  │
            │ (Past Due &  │  │ (Due Today   │
            │  Incomplete) │  │  or Future)  │
            └──────┬───────┘  └──────────────┘
                   │
           User completes todo?
                   │
                  YES
                   │
                   ▼
            ┌──────────────┐
            │  Completed   │
            │ (No longer   │
            │  overdue)    │
            └──────────────┘
```

**State Transitions**:
1. **Created → Never Overdue**: Todo created without due date
2. **Created → Evaluatable**: Todo created with due date
3. **Evaluatable → Not Overdue**: Current date is before or equal to due date
4. **Evaluatable → Overdue**: Current date is after due date AND todo is incomplete
5. **Overdue → Completed**: User marks todo as complete (removes overdue status)
6. **Not Overdue → Overdue**: Time passes and current date exceeds due date

**Triggering Events**:
- Todo creation
- Todo update (dueDate or completed field changes)
- Date change (midnight boundary) - requires page reload/refresh
- Component re-render (status recalculated)

---

## Data Flow

### 1. Todo List Rendering Flow

```
Backend API
    │
    │ GET /api/todos
    ▼
┌──────────────────┐
│  Frontend State  │
│  (todos array)   │
└────────┬─────────┘
         │
         │ Map over todos
         ▼
┌──────────────────────┐
│  Add isOverdue prop  │
│  for each todo       │
└────────┬─────────────┘
         │
         │ Sort todos
         ▼
┌──────────────────────┐
│ Group overdue first  │
│ (oldest due → newest)│
│ Then non-overdue     │
│ (newest → oldest)    │
└────────┬─────────────┘
         │
         │ Render
         ▼
    TodoList
         │
         ├─ TodoCard (overdue styling)
         ├─ TodoCard (overdue styling)
         ├─ TodoCard (normal)
         └─ TodoCard (normal)
```

### 2. Overdue Count Flow

```
Backend API
    │
    │ GET /api/todos
    ▼
┌──────────────────┐
│  Frontend State  │
│  (todos array)   │
└────────┬─────────┘
         │
         │ Filter: isOverdue === true
         ▼
┌──────────────────┐
│ Count overdue    │
│ todos.length     │
└────────┬─────────┘
         │
         │ Display in header
         ▼
    App Header
  "My Todos (3 overdue)"
```

### 3. Todo Completion Flow

```
User clicks complete
         │
         │ PATCH /api/todos/:id
         ▼
┌──────────────────┐
│   Update API     │
│ completed: true  │
└────────┬─────────┘
         │
         │ Response
         ▼
┌──────────────────┐
│  Update State    │
│  (todo updated)  │
└────────┬─────────┘
         │
         │ Re-render triggers
         ▼
┌──────────────────┐
│ Recompute        │
│ isOverdue        │
│ (now false)      │
└────────┬─────────┘
         │
         │ Re-sort list
         ▼
┌──────────────────┐
│ Remove from      │
│ overdue group    │
└────────┬─────────┘
         │
         │ Update count
         ▼
    Header count
    decreases by 1
```

---

## Computed Properties

### isOverdue Calculation

**Function Signature**:
```javascript
/**
 * Determines if a todo is overdue
 * @param {Object} todo - Todo object
 * @param {string|null} todo.dueDate - ISO 8601 date string
 * @param {boolean} todo.completed - Completion status
 * @returns {boolean} True if overdue
 */
function isOverdue(todo)
```

**Logic**:
```javascript
function isOverdue(todo) {
  // No due date = never overdue
  if (!todo.dueDate) return false;
  
  // Completed todos are never overdue
  if (todo.completed) return false;
  
  // Compare dates (using start of day to avoid time-of-day issues)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(todo.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  // Overdue only if due date is strictly before today
  return dueDate < today;
}
```

**Edge Cases**:
- `dueDate === null` → returns `false`
- `dueDate === today` → returns `false` (due today is not overdue)
- `completed === true` → returns `false` (completed todos never overdue)
- Invalid date string → treated as `NaN`, comparison returns `false` (safe fallback)

---

## Data Transformation

### Sorting Algorithm

**Function**: `sortTodos(todos)`

**Input**: Array of Todo objects with `isOverdue` property  
**Output**: New sorted array (does not mutate input)

**Algorithm**:
```javascript
function sortTodos(todos) {
  return [...todos].sort((a, b) => {
    // Primary sort: overdue status (overdue first)
    if (a.isOverdue !== b.isOverdue) {
      return a.isOverdue ? -1 : 1;
    }
    
    // Secondary sort (both overdue): by due date (oldest first)
    if (a.isOverdue && b.isOverdue) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    
    // Secondary sort (neither overdue): by creation date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}
```

**Complexity**: O(n log n) where n = number of todos  
**Performance**: <15ms for 100 todos (well under 500ms target)

**Example**:
```javascript
// Input
[
  { id: '1', title: 'A', dueDate: '2026-02-01', completed: false, createdAt: '2026-01-15', isOverdue: true },
  { id: '2', title: 'B', dueDate: '2026-02-10', completed: false, createdAt: '2026-01-20', isOverdue: false },
  { id: '3', title: 'C', dueDate: '2026-01-25', completed: false, createdAt: '2026-01-10', isOverdue: true },
  { id: '4', title: 'D', dueDate: null, completed: false, createdAt: '2026-01-25', isOverdue: false }
]

// Output (sorted)
[
  { id: '3', ... }, // Overdue, due 2026-01-25 (oldest)
  { id: '1', ... }, // Overdue, due 2026-02-01
  { id: '4', ... }, // Not overdue, created 2026-01-25 (newest)
  { id: '2', ... }  // Not overdue, created 2026-01-20
]
```

---

## Indexing & Performance

**No indexing needed** - all operations are client-side in-memory array operations.

**Performance Characteristics**:
- isOverdue check: O(1) per todo
- Sort operation: O(n log n)
- Count operation: O(n) with filter
- Total for 100 todos: ~115ms (well under 500ms target)

**Optimization Notes**:
- `useMemo` used to cache sorted array (only recomputes when `todos` array changes)
- `useMemo` used to cache overdue count (only recomputes when `todos` array changes)
- No optimization needed for isOverdue check (is cheap operation)

---

## Validation & Constraints

### Runtime Validation

No new validation needed. Existing backend validation applies:
- `dueDate` must be valid ISO 8601 format if present
- `completed` must be boolean
- `title` must be non-empty, max 255 characters

### Business Rules

1. **Overdue Definition**: Incomplete todo with due date strictly before today (start of day comparison)
2. **Completion Priority**: Completed todos are never considered overdue, regardless of due date
3. **No Due Date**: Todos without due date are never overdue
4. **Today Boundary**: Todos due today are NOT overdue (overdue applies only to past dates)
5. **Timezone**: Use browser local time for consistency with displayed due dates

---

## Migration Notes

**Database**: No migration required (no schema changes)  
**API**: No changes required (existing endpoints sufficient)  
**Frontend State**: No state migration required (computed property, not persisted)

---

## Testing Considerations

### Test Data Sets

**Scenario 1: Mixed Overdue Status**
```javascript
[
  { id: '1', title: 'Overdue 1', dueDate: '2026-01-01', completed: false, createdAt: '2025-12-15' },
  { id: '2', title: 'Due Today', dueDate: '2026-02-05', completed: false, createdAt: '2026-01-01' },
  { id: '3', title: 'Future', dueDate: '2026-03-01', completed: false, createdAt: '2026-01-10' },
  { id: '4', title: 'Completed Past', dueDate: '2026-01-15', completed: true, createdAt: '2026-01-01' },
  { id: '5', title: 'No Date', dueDate: null, completed: false, createdAt: '2026-02-01' }
]

Expected Overdue: ['1'] (only incomplete with past due date)
```

**Scenario 2: Multiple Overdue (Sort Validation)**
```javascript
[
  { id: 'A', dueDate: '2026-01-20', completed: false, isOverdue: true },
  { id: 'B', dueDate: '2026-01-10', completed: false, isOverdue: true },
  { id: 'C', dueDate: '2026-01-30', completed: false, isOverdue: true }
]

Expected Sort Order: ['B', 'A', 'C'] (oldest to newest)
```

### Boundary Conditions

- Empty todos array
- All todos overdue
- No todos overdue
- Single todo (various states)
- 100+ todos (performance validation)
- Invalid date strings (should handle gracefully)
- Null/undefined values (should handle gracefully)

---

## References

- Feature Spec: [spec.md](spec.md)
- Research Doc: [research.md](research.md)
- UI Guidelines: [../../docs/ui-guidelines.md](../../docs/ui-guidelines.md)
