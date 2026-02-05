<!--
Sync Impact Report - Constitution v1.0.0
========================================
Version Change: INITIAL → 1.0.0
Rationale: Initial constitution derived from existing project documentation

Principles Created:
- I. Test-Driven Development (NON-NEGOTIABLE)
- II. Code Quality and Maintainability  
- III. Single Responsibility
- IV. Accessibility First
- V. Documentation and Review

Sections Added:
- Technical Constraints
- Development Workflow
- Governance

Templates Status:
- ✅ plan-template.md: Reviewed - Constitution Check section ready for principle validation
- ✅ spec-template.md: Reviewed - Aligned with user story prioritization and testing requirements
- ✅ tasks-template.md: Reviewed - Task organization supports TDD workflow and story independence

Follow-up Actions: None - all placeholders resolved
-->

# Todo App Constitution

## Core Principles

### I. Test-Driven Development (NON-NEGOTIABLE)

Tests MUST be written as part of the development process, ideally before or alongside implementation. The Red-Green-Refactor cycle is strongly encouraged.

- Write tests that describe expected behavior before implementation
- Maintain minimum 80% code coverage across all packages
- Tests MUST be independent, isolated, and not rely on other tests
- Mock all external dependencies (API calls, timers, database)
- Focus on testing behavior, not implementation details

**Rationale**: TDD ensures code correctness, prevents regressions, and serves as living documentation. The 80% coverage target balances thoroughness with pragmatism, while test isolation ensures reliability and maintainability.

### II. Code Quality and Maintainability

All code MUST follow DRY (Don't Repeat Yourself), KISS (Keep It Simple), and SOLID principles.

- **DRY**: Extract common code into shared functions, components, or utilities
- **KISS**: Prefer simple, straightforward implementations over complex ones; avoid premature optimization
- **SOLID**: 
  - Single Responsibility: Each module/component has one reason to change
  - Open/Closed: Use props and composition for extension
  - Liskov Substitution: Follow React component contracts consistently
  - Interface Segregation: Keep prop lists focused and minimal
  - Dependency Inversion: Inject dependencies rather than hardcoding them
- Use descriptive naming: `camelCase` for variables/functions, `PascalCase` for components/classes, `UPPER_SNAKE_CASE` for constants
- Follow 2-space indentation, keep lines under 100 characters, remove trailing whitespace

**Rationale**: These principles reduce technical debt, improve code readability, and make the codebase easier to maintain and extend. Clear conventions eliminate decision fatigue and improve collaboration.

### III. Single Responsibility

Each module, component, function, and feature MUST have a single, well-defined responsibility.

- Components handle one specific UI concern
- Services handle one specific business logic domain
- Functions perform one clear operation
- Features focus on core functionality without unnecessary additions
- No organizational-only modules without clear purpose

**Rationale**: Single responsibility makes code easier to understand, test, and modify. It reduces coupling and increases cohesion, leading to more maintainable systems.

### IV. Accessibility First

All UI components MUST meet WCAG AA accessibility standards and implement inclusive design patterns.

- Color contrast MUST meet WCAG AA standards in both light and dark modes
- All interactive elements MUST be keyboard accessible
- Form labels MUST be properly associated with inputs
- Icon buttons MUST have descriptive titles or aria-labels
- Focus indicators MUST be visible and distinct
- Support system color scheme preferences
- Responsive design MUST work across desktop, tablet, and mobile

**Rationale**: Accessibility is not optional. Building inclusive experiences from the start is easier and more cost-effective than retrofitting. Every user deserves equal access to functionality.

### V. Documentation and Review

Code MUST be documented appropriately, and all changes MUST go through review before merging.

- Comment "why", not "what" the code does
- Use JSDoc for public functions and components
- Keep comments updated with code changes
- Atomic commits with clear, descriptive messages explaining the "why"
- Feature branches for new work (pattern: `feature/description`)
- Pull requests required for code review
- Code review checklist MUST be completed before merge:
  - Follows naming conventions
  - Imports organized correctly
  - No linting errors or warnings
  - Code is DRY
  - Single responsibility maintained
  - Error handling implemented
  - Tests written for new functionality
  - No console.log statements in production code

**Rationale**: Documentation captures intent and context that code alone cannot express. Code review catches issues early, shares knowledge, and maintains consistency across the team.

## Technical Constraints

**Technology Stack** (MUST be followed):
- Frontend: React with CSS for styling
- Backend: Node.js with Express.js
- Testing: Jest for all packages
- Testing Library: @testing-library/react for frontend component tests
- Package Management: npm workspaces (monorepo structure)
- Node Version: v16 or higher
- npm Version: v7 or higher

**File Organization** (enforced):
- Frontend structure: `packages/frontend/src/` with subdirectories for components/, services/, utils/, styles/, __tests__/
- Backend structure: `packages/backend/src/` with subdirectories for routes/, services/, middleware/, __tests__/
- Tests MUST be colocated in `__tests__/` directories
- Test files MUST be named `{filename}.test.js`

**Import Organization** (enforced):
1. External libraries first
2. Internal modules second
3. Styles last
4. Separate groups with blank lines
5. Use relative paths for internal modules
6. No circular dependencies

**Code Style** (enforced by linting):
- 2-space indentation
- LF (Unix-style) line endings
- Lines under 100 characters
- No trailing whitespace
- ESLint rules for consistency

## Development Workflow

**Testing Workflow** (MUST be followed):
1. Write tests for new features before or alongside implementation
2. Run tests locally before committing changes
3. Ensure all tests pass before creating pull requests
4. Review test coverage to identify gaps (target: 80%+)
5. Update tests when requirements change
6. Add tests for bug fixes before fixing the bug

**Git Workflow** (MUST be followed):
1. Create feature branches from main (pattern: `feature/description`)
2. Make atomic commits with clear messages
3. Commit message format: `type: description` with optional body and footer
4. Run linting and tests before pushing
5. Create pull request with description
6. Address code review feedback
7. Squash or merge commits as appropriate

**Continuous Improvement**:
- Guidelines are living documents
- Update based on team feedback
- Keep tooling and configurations current
- Share knowledge through code reviews

## Governance

This constitution supersedes all other practices and conventions. All code changes, pull requests, and reviews MUST verify compliance with these principles.

**Amendment Process**:
- Proposed changes MUST be documented with rationale
- Changes require team discussion and approval
- Breaking changes MUST include migration plan
- Version number MUST be updated according to semantic versioning:
  - MAJOR: Backward incompatible governance/principle changes
  - MINOR: New principle/section added or materially expanded
  - PATCH: Clarifications, wording, typo fixes

**Compliance Review**:
- All PRs MUST pass code review checklist
- Violations require explicit justification and documentation
- Complexity MUST be justified in plan.md complexity tracking
- Constitution check MUST be performed in plan.md before Phase 0 research

**Documentation References**:
- Detailed coding practices: `docs/coding-guidelines.md`
- Testing strategy: `docs/testing-guidelines.md`
- UI implementation: `docs/ui-guidelines.md`
- Feature requirements: `docs/functional-requirements.md`
- Project context: `docs/project-overview.md`

**Version**: 1.0.0 | **Ratified**: 2026-02-05 | **Last Amended**: 2026-02-05
