'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import ArtistCard from '@/components/ArtistCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Dashboard() {
    const [selectedServer, setSelectedServer] = useState<string>('');

    const { data: instances } = useQuery('instances', async () => {
        const res = await axios.get(`${API_BASE}/instances`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.data;
    });

    const { data: trending, isLoading: trendingLoading } = useQuery('trending', async () => {
        const res = await axios.get(`${API_BASE}/discovery/trending`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.data;
    });

    const { data: recommended, isLoading: recLoading } = useQuery(['recommendations', selectedServer], async () => {
        const url = selectedServer
            ? `${API_BASE}/discovery/recommendations?serverId=${selectedServer}`
            : `${API_BASE}/discovery/recommendations`;
        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return res.data;
    });

    return (
        <div className="container mx-auto p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Discovery Dashboard</h1>

                <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1 shadow-sm">
                    <span className="text-sm text-gray-500 mr-2">Library:</span>
                    <select
                        value={selectedServer}
                        onChange={(e) => setSelectedServer(e.target.value)}
                        className="bg-transparent text-sm font-medium focus:outline-none py-1"
                    >
                        <option value="">All Libraries</option>
                        {instances?.filter((i: any) => i.type === 'navidrome').map((instance: any) => (
                            <option key={instance.id} value={instance.id}>
                                {instance.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-orange-500 flex items-center">
                    <span className="mr-2">🔥</span> Trending Now
                </h2>
                {trendingLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {trending?.map((artist: any) => (
                            <ArtistCard key={artist.mbid || artist.name} artist={artist} type="trending" />
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-2xl font-semibold mb-4 text-blue-500 flex items-center">
                    <span className="mr-2">🎯</span> Similar to You
                </h2>
                {recLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {recommended?.map((artist: any) => (
                            <ArtistCard key={artist.mbid || artist.name} artist={artist} type="recommended" />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
