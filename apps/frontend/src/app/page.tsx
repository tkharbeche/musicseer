'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
    TrendingUp,
    Sparkles,
    Gem,
    Home,
    Search,
    Library,
    PlusSquare,
    Heart,
    Settings,
    LogOut,
    User as UserIcon,
    Loader2
} from 'lucide-react';
import ArtistCard from '@/components/ArtistCard';

export default function Dashboard() {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!storedToken) {
            router.push('/login');
        } else {
            setToken(storedToken);
            setUser(JSON.parse(storedUser || '{}'));
        }
    }, [router]);

    const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const { data: trending, isLoading: loadingTrending } = useQuery('trending', async () => {
        const res = await api.get('/discovery/trending');
        return res.data;
    }, { enabled: !!token });

    const { data: recommended, isLoading: loadingRecommended } = useQuery('recommended', async () => {
        const res = await api.get('/discovery/recommendations');
        return res.data;
    }, { enabled: !!token });

    const { data: hiddenGems, isLoading: loadingGems } = useQuery('hiddenGems', async () => {
        const res = await api.get('/discovery/hidden-gems');
        return res.data;
    }, { enabled: !!token });

    const handleRequest = async (artist: any) => {
        try {
            await api.post('/requests', {
                artistName: artist.name,
                artistMbid: artist.mbid
            });
            alert(`Requested ${artist.name} successfully!`);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to request artist');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!token) return null;

    return (
        <div className="flex h-screen bg-[#00050d] text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-black flex flex-col border-r border-white/5">
                <div className="p-6">
                    <div className="flex items-center gap-3 text-primary mb-10">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                            <PlusSquare size={24} className="text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">MusicSeerr</span>
                    </div>

                    <nav className="space-y-1">
                        <NavItem icon={<Home size={20} />} label="Home" active />
                        <NavItem icon={<Search size={20} />} label="Search" />
                        <NavItem icon={<Library size={20} />} label="Library" />
                    </nav>

                    <div className="mt-10">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4">Discovery</h3>
                        <nav className="space-y-1">
                            <NavItem icon={<TrendingUp size={20} />} label="Trending Now" />
                            <NavItem icon={<Sparkles size={20} />} label="Recommendations" />
                            <NavItem icon={<Gem size={20} />} label="Hidden Gems" />
                        </nav>
                    </div>
                </div>

                <div className="mt-auto p-6 space-y-4">
                    {user?.role === 'admin' && (
                        <NavItem icon={<Settings size={20} />} label="Admin Dashboard" onClick={() => router.push('/admin')} />
                    )}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group" onClick={handleLogout}>
                        <LogOut size={20} className="text-muted-foreground group-hover:text-red-400" />
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-red-400">Logout</span>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                            <UserIcon size={20} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold truncate">{user?.username}</span>
                            <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto spotify-gradient">
                <header className="sticky top-0 z-10 backdrop-blur-md bg-[#00050d]/40 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Good Day, {user?.username}</h2>
                </header>

                <div className="p-8 space-y-12 pb-24">
                    {/* Trending Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="text-primary" />
                                <h3 className="text-2xl font-bold">Trending Now</h3>
                            </div>
                        </div>
                        {loadingTrending ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {trending?.map((artist: any) => (
                                    <ArtistCard
                                        key={artist.mbid || artist.name}
                                        name={artist.name}
                                        imageUrl={artist.imageUrl}
                                        genres={artist.genres}
                                        onRequest={() => handleRequest(artist)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Recommendations Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Sparkles className="text-primary" />
                                <h3 className="text-2xl font-bold">Similar to Your Library</h3>
                            </div>
                        </div>
                        {loadingRecommended ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {recommended?.map((artist: any) => (
                                    <ArtistCard
                                        key={artist.mbid || artist.name}
                                        name={artist.name}
                                        imageUrl={artist.imageUrl || artist.image}
                                        genres={artist.genres}
                                        onRequest={() => handleRequest(artist)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Hidden Gems Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Gem className="text-primary" />
                                <h3 className="text-2xl font-bold">Hidden Gems</h3>
                            </div>
                        </div>
                        {loadingGems ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {hiddenGems?.map((artist: any) => (
                                    <ArtistCard
                                        key={artist.mbid || artist.name}
                                        name={artist.name}
                                        imageUrl={artist.imageUrl || artist.image}
                                        genres={artist.genres}
                                        onRequest={() => handleRequest(artist)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all cursor-pointer group ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
        >
            <div className={`${active ? 'text-primary' : 'group-hover:text-white'}`}>
                {icon}
            </div>
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}
