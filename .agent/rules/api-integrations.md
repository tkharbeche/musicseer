---
trigger: always_on
---

# External API Integrations

- **Last.fm**: Primary source for global trending, top tracks, and artist similarity [4, 14, 15].
- **MusicBrainz**: Source of truth for metadata, official releases, and MBID relations [16, 17].
- **Navidrome**: Synchronize library via Subsonic API to identify "missing" music [18].
- **Lidarr**: Final target for music requests via POST `/api/v1/artist` [19, 20].
- **Strategy**: Cache-first approach. External APIs are called via cron jobs (every 6-12h), not in real-time during user requests to ensure performance [17].
