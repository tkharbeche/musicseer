---
trigger: always_on
---

# PostgreSQL Database Rules

- **Schema Consistency**: Always use UUID for primary keys (`gen_random_uuid()`).
- **Core Tables**:
  - `users`: Internal auth and roles [10].
  - `server_instances`: Configuration for Navidrome/Lidarr [6, 10].
  - `artists_cache`: Global discovery data indexed by MBID [11].
  - `library_snapshot`: State of the user's library per instance [12].
  - `requests`: Status of artist/album requests (pending, approved, sent, failed) [13].
- **Integrity**: Use CASCADE deletes for user/server mappings [11].