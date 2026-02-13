// Core entity types
export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
    createdAt: Date;
    updatedAt: Date;
}

export interface ServerInstance {
    id: string;
    name: string;
    type: 'navidrome' | 'lidarr' | 'jellyfin';
    baseUrl: string;
    apiKey: string;
    username?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Artist {
    id: string;
    mbid?: string;
    name: string;
    lastfmPlaycount?: number;
    lastfmListeners?: number;
    genres?: string[];
    similarArtistMbids?: string[];
    bio?: string;
    imageUrl?: string;
    musicbrainzData?: any;
    lastSyncedAt: Date;
    createdAt: Date;
}

export interface LibrarySnapshot {
    id: string;
    serverId: string;
    artistMbid?: string;
    artistName: string;
    albumCount: number;
    trackCount: number;
    lastSyncedAt: Date;
    createdAt: Date;
}

export interface Request {
    id: string;
    userId: string;
    artistMbid?: string;
    artistName: string;
    albumMbid?: string;
    albumName?: string;
    status: 'pending' | 'approved' | 'rejected' | 'sent' | 'completed' | 'failed';
    targetServerId?: string;
    lidarrArtistId?: number;
    adminNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// API response types
export interface TrendingArtist {
    mbid?: string;
    name: string;
    rank: number;
    playcount: number;
    listeners: number;
    imageUrl?: string;
}

export interface RecommendedArtist {
    mbid?: string;
    name: string;
    score: number;
    reason: string;
    imageUrl?: string;
    genres?: string[];
}
