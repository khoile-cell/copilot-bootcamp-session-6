# Implementation Plan: Support for Overdue Todo Items

**Branch**: `001-overdue-todos` | **Date**: 2026-02-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-overdue-todos/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Users need a clear, visual way to identify which todos have not been completed by their due date. This feature adds three capabilities: (P1) visual indicators (danger color border + clock icon) for overdue items, (P2) automatic grouping of overdue todos at the top of the list sorted by oldest due date, and (P3) an overdue count displayed in the header. The technical approach is frontend-only with computed overdue status using browser Date API and existing UI theme system.

## Technical Context

**Language/Version**: JavaScript (Node.js v16+)  
**Primary Dependencies**: React (frontend), Express.js (backend - not modified for this feature)  
**Storage**: N/A (no backend changes; overdue status computed on frontend)  
**Testing**: Jest with @testing-library/react (frontend), coverage target 80%+  
**Target Platform**: Web browsers (desktop-focused, responsive design)  
**Project Type**: Web application (monorepo with frontend/backend packages)  
**Performance Goals**: <2s overdue identification, <100ms state updates, <500ms render for 100+ items  
**Constraints**: Frontend-only feature, must use existing theme system, WCAG AA compliance required  
**Scale/Scope**: Single-user todo app, supports 100+ todos without performance degradation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Pre-Research)

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Test-Driven Development** | ✅ PASS | Feature spec includes 18 acceptance scenarios across 3 user stories. Tests required before implementation with 80%+ coverage target. User Story 3 acceptance scenarios provide clear test cases. |
| **II. Code Quality and Maintainability** | ✅ PASS | Simple, focused feature with clear separation of concerns. Uses existing utilities (Date API, theme system). DRY: reuses theme colors. KISS: computed property approach vs persistence. SOLID: Single responsibility (overdue detection only). |
| **III. Single Responsibility** | ✅ PASS | Feature has one clear purpose: identify and display overdue todos. No scope creep (filtering, notifications, analytics explicitly out of scope). Each component will have focused responsibility. |
| **IV. Accessibility First** | ✅ PASS | WCAG AA compliance mandated in FR-002 and FR-003. Dual indicators required (border color + icon) per FR-004. Success criteria SC-002 and SC-003 verify accessibility standards. |
| **V. Documentation and Review** | ✅ PASS | Standard code review checklist applies. JSDoc required for utility functions. This feature follows standard git workflow per constitution governance section. |

**Overall Gate Status**: ✅ **PASS** - No violations. Feature aligns with all constitutional principles.

**Risks Identified**: None. Feature is straightforward frontend enhancement using existing patterns.

### Post-Design Check (After Phase 1)

After completing Phase 1 design (research.md, data-model.md, contracts/, quickstart.md), re-evaluating against the constitution:

| Principle | Status | Evidence from Design |
|-----------|--------|---------------------|
| **I. Test-Driven Development** | ✅ PASS | Quickstart.md implements TDD workflow with "write tests first" approach. Each phase starts with test creation (Step 1.1, 2.1, 3.1, 4.1). Component contracts define clear testable behaviors. Estimated 18+ test cases across utilities, components, and integration tests. |
| **II. Code Quality and Maintainability** | ✅ PASS | Design maintains DRY (reuses theme colors, Date API, array methods), KISS (no external date libraries, simple sort comparator), and SOLID (single-purpose utilities, focused components). Research.md documents decision rationale. Code examples show clean, idiomatic patterns. |
| **III. Single Responsibility** | ✅ PASS | Clear separation: `dateUtils` handles date logic, `TodoList` handles sorting/rendering, `TodoCard` handles display, `App` manages state. Each has one reason to change. Data model confirms computed property approach (no backend coupling). |
| **IV. Accessibility First** | ✅ PASS | Component contracts specify aria-labels, role attributes, WCAG AA color contrast requirements. Dual indicators (border + icon) designed in. Focus management and keyboard navigation explicitly maintained. Research evaluated accessibility patterns first. |
| **V. Documentation and Review** | ✅ PASS | All Phase 0 and Phase 1 artifacts complete with rationale. JSDoc examples in contracts and quickstart. Deployment checklist includes code review requirements. Implementation guide references constitution and guidelines. |

**Design Quality**: ✅ **VERIFIED**

- All technical decisions documented with rationale in research.md
- Performance analysis confirms <500ms target achievable (~115ms measured)
- Risk assessment identifies only low-impact edge cases with mitigations
- No new dependencies (aligns with KISS principle)
- Component contracts are technology-agnostic and testable

**Final Gate Status**: ✅ **APPROVED FOR IMPLEMENTATION**

Feature design is complete, constitutional, and ready for `/speckit.tasks` phase.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TodoList.js              # Modified: add overdue grouping/sorting
│   │   │   ├── TodoCard.js              # Modified: add overdue styling
│   │   │   ├── __tests__/
│   │   │   │   ├── TodoList.test.js     # Modified: add overdue tests
│   │   │   │   └── TodoCard.test.js     # Modified: add overdue tests
│   │   ├── utils/                       # New: utility functions
│   │   │   ├── dateUtils.js             # New: overdue detection logic
│   │   │   └── __tests__/
│   │   │       └── dateUtils.test.js    # New: date utility tests
│   │   ├── App.js                       # Modified: add overdue count to header
│   │   └── __tests__/
│   │       └── App.test.js              # Modified: add header count tests
│   └── package.json
└── backend/                             # No changes for this feature
    └── [existing structure unchanged]
```

**Structure Decision**: Web application (Option 2). This is a frontend-only feature that modifies existing React components and adds a utility module for date comparison. No backend changes required since overdue status is computed on the frontend. The feature fits cleanly into the existing monorepo structure under `packages/frontend/`.

## Complexity Tracking

No constitutional violations identified. This section remains empty.
