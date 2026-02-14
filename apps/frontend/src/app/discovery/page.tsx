'use client';

import { useQuery } from 'react-query';
import api from '@/lib/api';
import { TrendingArtist, RecommendedArtist, ServerInstance } from '@musicseer/shared-types';
import { useState } from 'react';

export default function DiscoveryPage() {
    const [selectedServer, setSelectedServer] = useState<string>('');

    const { data: trending, isLoading: trendingLoading } = useQuery<TrendingArtist[]>(
        'trending',
        async () => {
            const res = await api.get('/discovery/trending');
            return res.data;
        }
    );

    const { data: recommended, isLoading: recommendedLoading } = useQuery<RecommendedArtist[]>(
        ['recommendations', selectedServer],
        async () => {
            const res = await api.get('/discovery/recommendations', {
                params: { serverId: selectedServer || undefined }
            });
            return res.data;
        }
    );

    const { data: servers } = useQuery<ServerInstance[]>(
        'servers',
        async () => {
            const res = await api.get('/instances');
            return res.data;
        }
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8">Discovery</h1>

            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">Trending Now</h2>
                {trendingLoading ? (
                    <p>Loading trending artists...</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {trending?.map((artist) => (
                            <ArtistCard key={artist.name} artist={artist} />
                        ))}
                    </div>
                )}
            </section>

            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Recommended for You</h2>
                    <select
                        value={selectedServer}
                        onChange={(e) => setSelectedServer(e.target.value)}
                        className="rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    >
                        <option value="">All Servers</option>
                        {servers?.filter(s => s.type === 'navidrome').map(server => (
                            <option key={server.id} value={server.id}>{server.name}</option>
                        ))}
                    </select>
                </div>
                {recommendedLoading ? (
                    <p>Loading recommendations...</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {recommended?.map((artist) => (
                            <ArtistCard key={artist.name} artist={artist} isRecommendation />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function ArtistCard({ artist, isRecommendation = false }: { artist: any, isRecommendation?: boolean }) {
    // Filter out Last.fm placeholder image
    const imageUrl = artist.imageUrl && !artist.imageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')
        ? artist.imageUrl
        : null;

    const handleRequest = async () => {
        try {
            await api.post('/requests/artist', {
                artistName: artist.name,
                artistMbid: artist.mbid,
            });
            alert(`Requested ${artist.name}`);
        } catch (err: any) {
            alert(`Failed to request: ${err.response?.data?.message || err.message}`);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                    <img src={imageUrl} alt={artist.name} className="object-cover w-full h-full" />
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-4 text-center">
                        <svg className="w-12 h-12 mb-2 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                        </svg>
                        <span className="text-xs font-medium uppercase tracking-wider">{artist.name.charAt(0)}</span>
                    </div>
                )}
                {isRecommendation && (
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                        {Math.round(artist.score * 100)}% Match
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate" title={artist.name}>{artist.name}</h3>
                {isRecommendation && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{artist.reason}</p>
                )}
                <button
                    onClick={handleRequest}
                    className="mt-4 w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium py-2 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                    Request
                </button>
            </div>
        </div>
    );
}
