import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm';

@Entity('similarity_cache')
@Index(['sourceArtistName']) // Index by name since MBID might be missing for source
export class SimilarityCache {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'source_mbid', nullable: true })
    sourceMbid?: string;

    @Column({ name: 'source_artist_name' })
    sourceArtistName: string;

    @Column({ name: 'similar_artist_data', type: 'jsonb' })
    similarArtistData: {
        mbid?: string;
        name: string;
        match: number;
        url: string;
        image?: any[];
    }[];

    @CreateDateColumn({ name: 'cached_at' })
    cachedAt: Date;
}
