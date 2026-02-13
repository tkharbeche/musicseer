# MusicSeer

> Open-source music discovery and request management for Lidarr and Navidrome

MusicSeer is an Overseerr-like application for music, providing intelligent music discovery and automated request management. It integrates with Navidrome (music library) and Lidarr (music acquisition) to deliver personalized recommendations based on your existing collection.

## Features

- **🔥 Trending Now**: Discover globally trending artists from Last.fm
- **🎯 Similar to You**: Personalized recommendations based on your library
- **💎 Hidden Gems**: Discover underrated artists in your favorite genres
- **📝 Request Management**: Submit and track music requests to Lidarr
- **🔐 Multi-Instance Support**: Manage multiple Navidrome and Lidarr servers
- **⚡ Cache-First Architecture**: Fast responses with background sync jobs

## Architecture

### Stack
- **Frontend**: Next.js 14 with Tailwind CSS
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL 15
- **Orchestration**: Docker Compose

### Project Structure
```
musicseer/
├── apps/
│   ├── backend/          # NestJS API
│   └── frontend/         # Next.js UI
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── docker/
│   └── init.sql          # Database schema
└── docker-compose.yml    # Container orchestration
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/musicseer.git
cd musicseer
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API keys and database credentials
```

4. **Start with Docker**
```bash
pnpm docker:up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

### Development

**Local development without Docker:**
```bash
# Terminal 1 - Backend
pnpm --filter backend dev

# Terminal 2 - Frontend
pnpm --filter frontend dev
```

**View logs:**
```bash
pnpm docker:logs
```

**Stop containers:**
```bash
pnpm docker:down
```

## External API Keys

### Last.fm
1. Create an account at https://www.last.fm/api/account/create
2. Add `LASTFM_API_KEY` and `LASTFM_SHARED_SECRET` to `.env`

### MusicBrainz
- No API key required
- Add your contact email to `MUSICBRAINZ_CONTACT` in `.env`

## Database Schema

Core tables:
- `users` - Internal authentication
- `server_instances` - Navidrome/Lidarr configuration
- `artists_cache` - Global artist metadata
- `library_snapshot` - User's music library state
- `requests` - Music requests workflow

See `docker/init.sql` for complete schema.

## Roadmap

- [x] Phase 0: Environment & Infrastructure
- [ ] Phase 1: MVP & Connectivity
- [ ] Phase 2: Sync & Intelligence
- [ ] Phase 3: UX & Admin
- [ ] Phase 4: Extensions (Jellyfin support)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT © 2024

## Acknowledgments

- Inspired by [Overseerr](https://overseerr.dev/)
- Music data from [Last.fm](https://www.last.fm/) and [MusicBrainz](https://musicbrainz.org/)
