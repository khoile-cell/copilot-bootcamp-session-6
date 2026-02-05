# Feature Specification: Support for Overdue Todo Items

**Feature Branch**: `001-overdue-todos`  
**Created**: 2026-02-05  
**Status**: Draft  
**Input**: User description: "Support for Overdue Todo Items - Users need a clear, visual way to identify which todos have not been completed by their due date"

## Clarifications

### Session 2026-02-05

- Q: When overdue todos are grouped together at the top of the list (P2), how should multiple overdue items be ordered among themselves? → A: Most overdue first (oldest due date first)
- Q: What visual elements should be used to indicate overdue status? The spec requires both color and non-color indicators for WCAG AA compliance. → A: Orange border + clock/calendar icon
- Q: Where should the overdue count summary (P3 feature) be displayed in the UI? → A: Header/title area above the todo list (e.g., "My Todos (3 overdue)")
- Q: After the overdue group at the top, how should non-overdue todos be sorted in the remaining list? → A: Creation date (newest first)
- Q: What specific shade of orange should be used for the overdue border, ensuring it meets WCAG AA contrast standards in both light and dark modes? → A: Use existing UI theme's danger/warning color (from ui-guidelines.md)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visual Overdue Indicator (Priority: P1)

Users can immediately identify overdue todo items through distinct visual styling when viewing their todo list. An overdue item is defined as any incomplete todo with a due date that is before today's date. Overdue styling consists of an orange border around the todo card and a clock/calendar icon indicator.

**Why this priority**: This is the core value proposition of the feature. Without visual distinction, users must manually compare dates, defeating the purpose of the feature. This delivers immediate value by making overdue items instantly recognizable.

**Independent Test**: Can be fully tested by creating todos with past due dates and verifying they display with orange border and clock/calendar icon. Delivers value independently by solving the primary user problem.

**Acceptance Scenarios**:

1. **Given** I have an incomplete todo with a due date of yesterday, **When** I view my todo list, **Then** the todo is displayed with an orange border and clock/calendar icon
2. **Given** I have an incomplete todo with a due date of one week ago, **When** I view my todo list, **Then** the todo is displayed with an orange border and clock/calendar icon
3. **Given** I have a completed todo with a due date in the past, **When** I view my todo list, **Then** the todo is NOT displayed with overdue styling (no orange border or icon)
4. **Given** I have an incomplete todo with a due date of today, **When** I view my todo list, **Then** the todo is NOT displayed with overdue styling (no orange border or icon; due today is not overdue)
5. **Given** I have an incomplete todo with a due date in the future, **When** I view my todo list, **Then** the todo is NOT displayed with overdue styling (no orange border or icon)
6. **Given** I have an incomplete todo with no due date, **When** I view my todo list, **Then** the todo is NOT displayed with overdue styling (no orange border or icon)

---

### User Story 2 - Overdue Item Grouping (Priority: P2)

Users can view overdue todos grouped or sorted separately from other todos, making it easier to focus on past-due items that need immediate attention. Within the overdue group, todos are sorted by due date with the most overdue items (oldest due dates) appearing first.

**Why this priority**: While visual indicators solve the core problem, grouping provides better organization and focus. Users with many todos benefit from seeing overdue items together. This builds upon P1 but is not strictly necessary for basic overdue identification.

**Independent Test**: Can be tested by creating a mix of overdue, current, and future todos, then verifying they are grouped with overdue items appearing first or in a separate section. Delivers value by improving task prioritization workflow.

**Acceptance Scenarios**:

1. **Given** I have multiple overdue todos and multiple non-overdue todos, **When** I view my todo list, **Then** overdue todos appear grouped together at the top of the list, sorted with oldest due date first, followed by non-overdue todos sorted by creation date (newest first)
2. **Given** I have no overdue todos, **When** I view my todo list, **Then** the normal todo order is maintained (sorted by creation date, newest first)
3. **Given** I mark an overdue todo as complete, **When** the list updates, **Then** the todo is removed from the overdue group
4. **Given** I add a new todo with a past due date, **When** the list updates, **Then** the new todo appears in the overdue group in the correct sort position (based on due date)
5. **Given** I have overdue todos with due dates of Jan 1, Jan 15, and Jan 30, **When** I view my todo list, **Then** they appear in order: Jan 1, Jan 15, Jan 30 (oldest/most overdue first)

---

### User Story 3 - Overdue Count Summary (Priority: P3)

Users can see a count or summary of how many todos are currently overdue in the header/title area above the todo list, providing a quick overview of their task backlog without scanning the entire list. The count is displayed as part of the page title (e.g., "My Todos (3 overdue)").

**Why this priority**: This is a nice-to-have enhancement that provides at-a-glance information. While useful for awareness, it doesn't fundamentally improve the ability to identify or act on overdue items. Users can still count manually if needed.

**Independent Test**: Can be tested by creating various numbers of overdue todos and verifying the count displays correctly in the header. Delivers value by providing quick status awareness.

**Acceptance Scenarios**:

1. **Given** I have 3 overdue todos, **When** I view my todo list, **Then** I see the header showing "My Todos (3 overdue)" or similar format
2. **Given** I have no overdue todos, **When** I view my todo list, **Then** the header shows "My Todos" without overdue count or shows "(0 overdue)"
3. **Given** I complete one of my overdue todos, **When** the list updates, **Then** the header count decreases by 1 (e.g., from "3 overdue" to "2 overdue")
4. **Given** I add a new todo with a past due date, **When** the list updates, **Then** the header count increases by 1

---

### Edge Cases

- What happens when a todo's due date is today at 11:59 PM? (Should not be marked overdue until tomorrow)
- What happens to overdue styling in different timezones? (Use browser/system local time for consistency with how due dates are displayed)
- What happens if a user leaves the app open overnight and a todo becomes overdue? (Overdue status should update when the list refreshes or page reloads; real-time updates not required for MVP)
- What happens when the system date changes while viewing the list? (Acceptable to show stale data until next refresh/reload)
- What if a user has 100+ overdue items? (Overdue grouping still applies; no special handling needed beyond normal list performance)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST determine if a todo is overdue by comparing the todo's due date with the current date (using browser local time)
- **FR-002**: System MUST mark a todo as overdue ONLY if all these conditions are met: (1) the todo has a due date, (2) the due date is before today's date (not including today), and (3) the todo is not marked as complete
- **FR-003**: System MUST apply distinct visual styling to overdue todos consisting of a border around the todo card using the theme's danger color (as defined in ui-guidelines.md) and a clock/calendar icon that meets WCAG AA color contrast standards in both light and dark modes
- **FR-004**: Visual overdue indicator MUST include both color (danger color border) and non-color (clock/calendar icon) methods of differentiation to support users with color vision deficiencies
- **FR-005**: System MUST remove overdue styling from a todo immediately when it is marked as complete
- **FR-006**: System MUST NOT mark todos with no due date as overdue
- **FR-007**: System MUST NOT mark todos due today as overdue (overdue status applies only to dates strictly in the past)
- **FR-008**: Overdue determination MUST use the browser's local date/time to ensure consistency with how due dates are displayed to users
- **FR-009**: System MUST display overdue todos grouped together, appearing before non-overdue todos in the list, with overdue items sorted by due date (oldest due date first) within the overdue group; non-overdue todos MUST be sorted by creation date (newest first) (Priority P2 requirement)
- **FR-010**: System MUST display a count of currently overdue todos in the header/title area above the todo list (e.g., "My Todos (3 overdue)") (Priority P3 requirement)
- **FR-011**: Overdue count MUST update automatically when todos are added, completed, or deleted
- **FR-012**: Overdue styling MUST be applied during list rendering; no additional API calls required to determine overdue status

### Key Entities

- **Todo Item (existing entity, enhanced)**: Represents a user's task with attributes including:
  - `id`: Unique identifier
  - `title`: Task description
  - `dueDate`: Optional date when task should be completed
  - `completed`: Boolean status
  - `createdAt`: Timestamp
  - **Computed property**: `isOverdue` - Boolean derived from dueDate, completed status, and current date (not persisted to backend)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify an overdue todo within 2 seconds of viewing the todo list, as measured by visual distinction from non-overdue items
- **SC-002**: Overdue visual styling meets WCAG AA color contrast ratio standards (minimum 4.5:1 for text, 3:1 for UI components) in both light and dark modes
- **SC-003**: Users with color vision deficiencies can identify overdue items through non-color indicators (verified through accessibility testing)
- **SC-004**: Overdue status updates immediately (within 100ms) when a todo is marked complete or incomplete
- **SC-005**: Todo list with 100+ items (including overdue items) renders and displays overdue indicators without noticeable performance degradation (less than 500ms render time)
- **SC-006**: Overdue count displays accurately and updates within 100ms when todos are added, completed, or deleted
- **SC-007**: Zero false positives - todos without due dates, dues today, or completed todos are never marked as overdue
- **SC-008**: Zero false negatives - all incomplete todos with past due dates are consistently marked as overdue when list is displayed

## Assumptions

- The existing todo application already supports due dates on todo items
- The frontend can access the current date/time from the browser
- The backend does not need to store or track overdue status (it's computed on the frontend)
- Users understand the concept of "overdue" in the context of task management
- The default behavior for grouping overdue items is to show them first in the list
- Real-time updates (e.g., a todo becoming overdue while the user watches) are not required for initial implementation
- The existing color scheme supports adding a distinct "overdue" color that meets accessibility standards

## Dependencies

- Existing todo list display component
- Existing todo data structure with `dueDate`, `completed`, and `createdAt` fields
- Date comparison utilities or browser Date API
- UI theme system supporting both light and dark modes
- Accessibility testing tools for WCAG AA validation

## Out of Scope

- Custom user preferences for overdue visual styling
- Notifications or alerts when todos become overdue
- Historical tracking of how long items have been overdue
- Different urgency levels for overdue items (e.g., "slightly overdue" vs "very overdue")
- Filtering to show only overdue items (may be added in future)
- Backend API changes or database schema modifications
- Snooze or postpone functionality for overdue items
- Analytics or reporting on overdue patterns
