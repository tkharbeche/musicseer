---
trigger: always_on
---

# MusicSeerr Project Architecture

- **Goal**: Open-source music discovery and request manager (Overseerr for music) [1].
- **Stack**: 
  - Frontend: Next.js (Tailwind, React Query) [2].
  - Backend: NestJS (TypeScript) [2, 3].
  - Database: PostgreSQL [4].
- **Core Concept**: Multi-instance orchestration. MusicSeerr must be decoupled from specific instances; it manages multiple Navidrome (source) and Lidarr (target) servers [5, 6].
- **Authentication**: Internal JWT system. Navidrome/Jellyfin are external providers, not primary auth [7].
