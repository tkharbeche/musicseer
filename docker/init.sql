-- MusicSeer Database Initialization Script
-- PostgreSQL 15+ with UUID support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (internal authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Server instances (Navidrome and Lidarr configurations)
CREATE TABLE IF NOT EXISTS server_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('navidrome', 'lidarr', 'jellyfin')),
    base_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(500) NOT NULL,
    username VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(base_url, type)
);

-- User to server instance mappings
CREATE TABLE IF NOT EXISTS user_server_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    server_id UUID NOT NULL REFERENCES server_instances(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, server_id)
);

-- Global artists cache (from Last.fm and MusicBrainz)
CREATE TABLE IF NOT EXISTS artists_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mbid UUID UNIQUE,
    name VARCHAR(500) NOT NULL,
    lastfm_playcount BIGINT DEFAULT 0,
    lastfm_listeners BIGINT DEFAULT 0,
    popularity_score FLOAT DEFAULT 0,
    latest_release_date TIMESTAMP WITH TIME ZONE,
    genres TEXT[],
    similar_artist_mbids UUID[],
    bio TEXT,
    image_url VARCHAR(1000),
    musicbrainz_data JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_artists_cache_mbid ON artists_cache(mbid);
CREATE INDEX IF NOT EXISTS idx_artists_cache_name ON artists_cache(name);

-- Library snapshot (current state of user's Navidrome library)
CREATE TABLE IF NOT EXISTS library_snapshot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES server_instances(id) ON DELETE CASCADE,
    artist_mbid UUID,
    artist_name VARCHAR(500) NOT NULL,
    album_count INTEGER DEFAULT 0,
    track_count INTEGER DEFAULT 0,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id, artist_mbid)
);

CREATE INDEX IF NOT EXISTS idx_library_snapshot_server ON library_snapshot(server_id);
CREATE INDEX IF NOT EXISTS idx_library_snapshot_mbid ON library_snapshot(artist_mbid);

-- Music requests (pending, approved, sent to Lidarr)
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_mbid UUID,
    artist_name VARCHAR(500) NOT NULL,
    album_mbid UUID,
    album_name VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sent', 'completed', 'failed')),
    target_server_id UUID REFERENCES server_instances(id) ON DELETE SET NULL,
    lidarr_artist_id INTEGER,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_artist_mbid ON requests(artist_mbid);

-- Trending cache (Last.fm global charts)
CREATE TABLE IF NOT EXISTS trending_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_mbid UUID,
    artist_name VARCHAR(500) NOT NULL,
    rank INTEGER NOT NULL,
    chart_type VARCHAR(50) NOT NULL DEFAULT 'global',
    image_url VARCHAR(1000),
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(artist_mbid, chart_type)
);

CREATE INDEX IF NOT EXISTS idx_trending_cache_chart ON trending_cache(chart_type, rank);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_instances_updated_at BEFORE UPDATE ON server_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
