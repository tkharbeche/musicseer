'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        router.push('/login');
    };

    return (
        <nav className="bg-gray-900 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold">MusicSeer</Link>
                <div className="space-x-6 flex items-center">
                    {isLoggedIn ? (
                        <>
                            <Link href="/dashboard" className="hover:text-blue-400">Dashboard</Link>
                            <Link href="/requests" className="hover:text-blue-400">Requests</Link>
                            <Link href="/admin" className="hover:text-blue-400">Admin</Link>
                            <button
                                onClick={handleLogout}
                                className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-sm transition-colors"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded font-semibold transition-colors">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
