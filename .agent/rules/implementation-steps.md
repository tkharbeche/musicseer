---
trigger: always_on
---

# Implementation Steps & Order of Operations

To ensure project stability and avoid refactoring, follow these phases in strict chronological order.

## Phase 0: Environment & Infrastructure (Skeleton)
**Goal**: Establish the monorepo and containerized environment.
1. **Monorepo Scaffolding**: Setup `pnpm` workspaces for `apps/backend`, `apps/frontend`, and `packages/shared-types` [1, 2].
2. **Docker Orchestration**: Configure `docker-compose.yml` with PostgreSQL 15, NestJS backend, and Next.js frontend [3, 4].
3. **Database Initialization**: Execute `init.sql` to create core tables with UUIDs (`users`, `server_instances`, `artists_cache`, etc.) [5-7].
4. **Environment Setup**: Define `.env.example` with placeholders for Last.fm and MusicBrainz keys [3, 5].

## Phase 1: MVP & Connectivity (Foundations)
**Goal**: Establish authentication and basic external communications.
1. **Internal Auth**: Implement JWT-based internal authentication system (decoupled from Navidrome) [8].
2. **Instance Management**: Create API modules to add, list, and configure `server_instances` (Navidrome and Lidarr) [1, 6, 9].
3. **Global Discovery**: Implement the **Trending Now** section using Last.fm `chart.getTopArtists` (Global cache-first approach) [10-12].
4. **Basic Request Flow**: Implement the `POST /api/v1/artist` connection to Lidarr with a 'Pending' status in the local DB [13, 14].

## Phase 2: Sync & Intelligence (The Core)
**Goal**: Personalize recommendations based on the user's local library.
1. **Library Sync Engine**: Develop the cron job using Subsonic API to scan Navidrome instances and populate `library_snapshot` [15-17].
2. **Similarity Service**: Implement `artist.getSimilar` calls to Last.fm for artists already in the user's library [10, 16].
3. **Recommendation Engine**: Code the weighted scoring algorithm:
   - Global Popularity (40%)
   - Library Similarity (30%)
   - Genre Diversity (20%)
   - New Releases/Freshness (10%) [2, 12, 13, 18].
4. **Cache Manager**: Ensure all external metadata (MusicBrainz) and charts are cached to avoid real-time API latency [16, 19, 20].

## Phase 3: UX & Admin (Polishing)
**Goal**: User management and advanced interface.
1. **Admin Dashboard**: Build interfaces for server management and user mapping [9].
2. **Approval Workflow**: Implement the UI for admins to approve/deny music requests [13, 16].
3. **Multi-Instance Filtering**: Enable the frontend to filter "Similar to You" results based on the specific `server_id` selected by the user [21, 22].

## Phase 4: Extensions (Future Proofing)
**Goal**: Add secondary features and third-party providers.
1. **Jellyfin Support**: Add a provider module for Jellyfin as a library source [23, 24].
2. **Notifications**: Implement webhooks or alerts for completed requests [3].

## General Constraints
- **Strict Ordering**: Do not implement Phase 2 before Phase 1 is fully functional and tested via Docker.
- **Cache-First**: No real-time external API calls during user navigation; always read from the PostgreSQL cache [16, 20].