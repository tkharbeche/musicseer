---
trigger: always_on
---

# Repository Structure (Monorepo pnpm)

- **Root**: Managed via pnpm-workspace.
- **Paths**:
  - `apps/backend/`: NestJS API.
  - `apps/frontend/`: Next.js UI.
  - `packages/shared-types/`: Shared TypeScript interfaces.
  - `docker/`: Orchestration and DB initialization scripts [6].
- **Constraint**: No heavy business logic on the frontend; everything must be processed in the backend [2].
