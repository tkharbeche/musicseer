import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('artists_cache')
export class ArtistCache {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true, unique: true })
    mbid?: string;

    @Column({ type: 'float', default: 0, name: 'popularity_score' })
    popularityScore: number;

    @Column({ type: 'timestamp', nullable: true, name: 'latest_release_date' })
    latestReleaseDate?: Date;

    @Column({ length: 500 })
    name: string;

    @Column({ type: 'bigint', default: 0, name: 'lastfm_playcount' })
    lastfmPlaycount: number;

    @Column({ type: 'bigint', default: 0, name: 'lastfm_listeners' })
    lastfmListeners: number;

    @Column({ type: 'text', array: true, nullable: true })
    genres?: string[];

    @Column({ type: 'uuid', array: true, nullable: true, name: 'similar_artist_mbids' })
    similarArtistMbids?: string[];

    @Column({ type: 'text', nullable: true })
    bio?: string;

    @Column({ length: 1000, nullable: true, name: 'image_url' })
    imageUrl?: string;

    @Column({ type: 'jsonb', nullable: true, name: 'musicbrainz_data' })
    musicbrainzData?: any;

    @CreateDateColumn({ name: 'last_synced_at' })
    lastSyncedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
