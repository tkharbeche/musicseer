import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm';

@Entity('artists_cache')
export class ArtistCache {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, nullable: true })
    @Index()
    mbid: string | null;

    @Column()
    @Index()
    name: string;

    @Column({ name: 'lastfm_playcount', type: 'bigint', default: 0 })
    lastfmPlaycount: number;

    @Column({ name: 'lastfm_listeners', type: 'bigint', default: 0 })
    lastfmListeners: number;

    @Column({ name: 'popularity_score', type: 'float', default: 0 })
    popularityScore: number;

    @Column({ name: 'latest_release_date', nullable: true })
    latestReleaseDate: Date;

    @Column("text", { array: true, nullable: true })
    genres: string[];

    @Column({ name: 'bio', type: 'text', nullable: true })
    bio?: string;

    @Column({ name: 'image_url', nullable: true })
    imageUrl?: string;

    @Column({ name: 'musicbrainz_data', type: 'jsonb', nullable: true })
    musicbrainzData?: any;

    @Column({ name: 'last_synced_at' })
    lastSyncedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
