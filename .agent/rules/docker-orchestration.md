---
trigger: always_on
---

# Docker & Orchestration

- **Compose**: Orchestrate 3 main services: `db` (Postgres 15-alpine), `backend` (4000), and `frontend` (3000).
- **Dockerfiles**: 
  - Use multi-stage builds to optimize image size.
  - Base images: `node:20-slim`.
  - Use `pnpm` for dependency management inside containers.
- **Environment**: All sensitive data (API keys, DB secrets) must be in `.env` and documented in `.env.example` [8, 9].