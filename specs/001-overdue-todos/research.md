# Research: Support for Overdue Todo Items

**Feature**: 001-overdue-todos  
**Phase**: 0 (Research & Design Decision)  
**Date**: 2026-02-05

## Purpose

Research and document technical decisions for implementing overdue todo detection and display. All NEEDS CLARIFICATION items from Technical Context have been resolved. This document consolidates best practices and rationale for technical choices.

## Research Areas

### 1. Date Comparison in JavaScript

**Question**: What is the most reliable approach for comparing dates to determine if a todo is overdue?

**Options Evaluated**:
- Native Date objects with comparison operators
- Date utility libraries (date-fns, moment.js, dayjs)
- String comparison on ISO date strings

**Decision**: **Native Date objects with comparison operators**

**Rationale**:
- No additional dependencies needed (aligns with KISS principle)
- Browser Date API is standardized and well-supported
- Performance is excellent for this use case (<100 items)
- Simple logic: `new Date(dueDate) < new Date().setHours(0,0,0,0)`
- Date utility library would be overkill for simple date comparison

**Implementation Pattern**:
```javascript
/**
 * Determines if a todo is overdue based on due date and completion status
 * @param {Object} todo - Todo item with dueDate and completed properties
 * @returns {boolean} True if todo is overdue
 */
function isOverdue(todo) {
  if (!todo.dueDate || todo.completed) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  const dueDate = new Date(todo.dueDate);
  dueDate.setHours(0, 0, 0, 0); // Start of due date
  
  return dueDate < today;
}
```

**Alternatives Considered**:
- **date-fns**: Excellent library but adds 13-15KB minified. Unnecessary for simple date comparison.
- **String comparison**: Brittle and error-prone with timezone handling.

---

### 2. React Re-rendering Strategy for Computed Values

**Question**: How should overdue status be computed to avoid unnecessary re-renders?

**Options Evaluated**:
- Compute in render function
- Memoize with useMemo
- Store in component state
- Derive during array mapping

**Decision**: **Compute during array mapping in TodoList component**

**Rationale**:
- Overdue status is derived from props (dueDate, completed) + current date
- No expensive computation (<1ms per todo)
- Array mapping already iterates over todos for rendering
- Adding `isOverdue` property during map is negligible overhead
- Avoids lifting state or creating separate memoization logic
- Performance target (500ms for 100+ items) easily met

**Implementation Pattern**:
```javascript
function TodoList({ todos }) {
  // Group and sort todos with overdue status
  const sortedTodos = useMemo(() => {
    const todosWithOverdue = todos.map(todo => ({
      ...todo,
      isOverdue: isOverdue(todo)
    }));
    
    return sortTodos(todosWithOverdue);
  }, [todos]);
  
  return sortedTodos.map(todo => (
    <TodoCard key={todo.id} todo={todo} />
  ));
}
```

**Alternatives Considered**:
- **useMemo for each todo**: Over-engineering for simple boolean computation
- **Component state**: Adds complexity and requires effect to update when date changes
- **Backend computation**: Outside scope; requires API changes and doesn't handle midnight transitions

---

### 3. Array Sorting Strategy for Grouping

**Question**: What's the most efficient way to group overdue todos at the top while maintaining sort order within groups?

**Options Evaluated**:
- Two-pass: filter overdue, filter non-overdue, concat
- Single-pass: custom sort comparator
- Array.reduce with accumulator object
- Separate components for overdue/non-overdue sections

**Decision**: **Single-pass custom sort comparator**

**Rationale**:
- Single array iteration (O(n log n) for sort vs O(2n) for two filters)
- Maintains single list structure (simpler rendering)
- Clean, declarative code
- Easy to modify sort logic in one place
- Aligns with Single Responsibility: one function handles all sorting

**Implementation Pattern**:
```javascript
/**
 * Sorts todos with overdue items first (by oldest due date),
 * then non-overdue items (by newest creation date)
 */
function sortTodos(todos) {
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

**Alternatives Considered**:
- **Two-pass filter**: More code, less efficient, but more readable. Rejected for performance.
- **Separate overdue section component**: Adds complexity for minimal benefit.

---

### 4. Accessibility Patterns for Visual Indicators

**Question**: What's the best way to combine color and non-color indicators for WCAG AA compliance?

**Options Evaluated**:
- Border + icon
- Background color + icon
- Text color + bold + icon
- Badge/pill element

**Decision**: **Border (danger theme color) + clock icon**

**Rationale**:
- Danger color border: Uses existing theme system (DRY principle)
- Clock/calendar icon: Universal symbol for time/deadline across cultures
- Border + icon provides dual indicators (WCAG AA requirement)
- Less intrusive than background color (doesn't obscure content)
- Icon can have aria-label for screen readers
- Theme system already defines danger colors meeting WCAG AA standards

**Implementation Pattern**:
```javascript
function TodoCard({ todo }) {
  const cardStyle = todo.isOverdue ? 'todo-card todo-card--overdue' : 'todo-card';
  
  return (
    <div className={cardStyle}>
      {todo.isOverdue && (
        <span className="overdue-indicator" aria-label="Overdue" role="img">
          🕐
        </span>
      )}
      {/* rest of card content */}
    </div>
  );
}
```

```css
.todo-card--overdue {
  border: 2px solid var(--color-danger); /* Theme danger color */
}
```

**Alternatives Considered**:
- **Background highlight**: Too visually heavy, reduces readability
- **Text color only**: Insufficient for color-blind users
- **Warning triangle icon**: Clock icon is more semantically appropriate for time-related issues

---

### 5. Header Count Implementation

**Question**: Where and how should the overdue count be calculated and displayed?

**Options Evaluated**:
- Calculate in App component, pass as prop to header
- Calculate in TodoList, lift to App via callback
- Create separate useOverdueCount hook
- Calculate inline in header component

**Decision**: **Calculate in App component where todos state lives**

**Rationale**:
- App component already manages todos state
- Count is derived from todos array: `todos.filter(isOverdue).length`
- Simple computation, no need for custom hook
- Keeps state colocated with todo management logic
- Easy to update when todos change (same state trigger)

**Implementation Pattern**:
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
      <TodoList todos={todos} />
    </div>
  );
}
```

**Alternatives Considered**:
- **Custom hook**: Over-engineering for simple filter + count operation
- **Context provider**: Unnecessary complexity for prop passing one level

---

## Technology Stack Decisions

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Date Handling | Native JavaScript Date API | No dependencies, sufficient for requirement |
| Sorting Algorithm | Array.sort with custom comparator | Efficient, clean, single-pass |
| State Management | React useState + useMemo | Existing pattern in codebase |
| Styling Approach | CSS classes + existing theme | Leverages theme system, DRY principle |
| Icon Implementation | Unicode emoji or SVG | Accessible, no icon library needed |
| Testing Strategy | Jest + @testing-library/react | Existing test infrastructure |

---

## Performance Analysis

| Operation | Complexity | Expected Time | Acceptable? |
|-----------|-----------|---------------|-------------|
| isOverdue check | O(1) | <1ms per todo | ✅ Yes |
| Sort 100 todos | O(n log n) | ~10-15ms | ✅ Yes (<500ms target) |
| Count overdue | O(n) | <5ms | ✅ Yes (<100ms target) |
| Render 100 cards | O(n) | ~50-100ms | ✅ Yes (<500ms target) |
| **Total (worst case)** | | **~115ms** | ✅ Well under 500ms target |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Timezone edge cases | Low | Medium | Use browser local time consistently; document assumption |
| Midnight transition | Low | Low | Accept stale data until page refresh (documented in spec) |
| Performance with 1000+ todos | Very Low | Low | Optimization not needed (spec targets 100 items) |
| Theme color contrast issues | Very Low | High | Use existing danger colors pre-validated for WCAG AA |

---

## Open Questions

None. All technical decisions resolved. Ready for Phase 1 design.

---

## References

- [MDN: Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [React: useMemo](https://react.dev/reference/react/useMemo)
- [WCAG 2.1 Success Criterion 1.4.1: Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html)
- Project: [UI Guidelines](../../docs/ui-guidelines.md)
- Project: [Constitution](../../.specify/memory/constitution.md)
