'use client';

import axios from 'axios';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ArtistCardProps {
    artist: any;
    type: 'trending' | 'recommended';
}

export default function ArtistCard({ artist, type }: ArtistCardProps) {
    const [requesting, setRequesting] = useState(false);
    const [requested, setRequested] = useState(false);

    const handleRequest = async () => {
        setRequesting(true);
        try {
            await axios.post(`${API_BASE}/requests`, {
                artistName: artist.name,
                artistMbid: artist.mbid,
                // Defaulting to first instance for simplicity in MVP
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setRequested(true);
        } catch (err) {
            console.error('Request failed', err);
        } finally {
            setRequesting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800 flex flex-col h-full">
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                {artist.imageUrl ? (
                    <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 font-bold text-4xl">
                        {artist.name[0]}
                    </div>
                )}
                {type === 'trending' && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-bold backdrop-blur-sm">
                        #{artist.rank}
                    </div>
                )}
            </div>

            <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-bold text-lg truncate mb-1" title={artist.name}>
                    {artist.name}
                </h3>

                {type === 'recommended' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 italic">
                        {artist.reason}
                    </p>
                )}

                <div className="mt-auto pt-3">
                    {requested ? (
                        <button
                            disabled
                            className="w-full py-2 px-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-sm font-semibold"
                        >
                            ✓ Requested
                        </button>
                    ) : (
                        <button
                            onClick={handleRequest}
                            disabled={requesting}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300 rounded-lg text-sm font-semibold transition-colors"
                        >
                            {requesting ? 'Requesting...' : 'Request'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
