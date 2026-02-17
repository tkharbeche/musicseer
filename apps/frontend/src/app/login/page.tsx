'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import gsap from 'gsap';
import { Music, Lock, User, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const formRef = useRef(null);
    const logoRef = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline();
        tl.fromTo(logoRef.current,
            { y: -50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: 'back.out(1.7)' }
        );
        tl.fromTo(formRef.current,
            { scale: 0.9, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out' },
            '-=0.5'
        );
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`, {
                email,
                password,
            });

            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            gsap.to(formRef.current, {
                y: 50,
                opacity: 0,
                duration: 0.5,
                onComplete: () => router.push('/')
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            setLoading(false);

            // Shake animation on error
            gsap.to(formRef.current, {
                keyframes: [
                    { x: -10, duration: 0.1 },
                    { x: 10, duration: 0.1 },
                    { x: -10, duration: 0.1 },
                    { x: 10, duration: 0.1 },
                    { x: 0, duration: 0.1 }
                ],
                ease: 'power1.inOut'
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#00050d]">
            {/* Animated background circles */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse" />

            <div ref={logoRef} className="mb-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)] mb-4">
                    <Music size={40} className="text-white" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-white">MusicSeerr</h1>
                <p className="text-muted-foreground mt-2">Connect to your media universe</p>
            </div>

            <div ref={formRef} className="w-full max-w-md glass p-8 rounded-3xl shadow-2xl">
                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Username or Email</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white"
                                placeholder="Enter your Navidrome username"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        MusicSeerr uses your Navidrome credentials to keep your library in sync.
                    </p>
                </div>
            </div>
        </div>
    );
}
