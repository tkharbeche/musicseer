import Link from 'next/link';

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MusicSeer
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10">
                The intelligent music discovery and request management bridge for your self-hosted music ecosystem.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    href="/dashboard"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105"
                >
                    Get Started
                </Link>
                <Link
                    href="https://github.com/yourusername/musicseer"
                    className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                    View on GitHub
                </Link>
            </div>

            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl">
                <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-4 text-2xl">🔥</div>
                    <h3 className="text-xl font-bold mb-2">Discovery</h3>
                    <p className="text-gray-500 dark:text-gray-400">Discover trending artists and personalized recommendations from Last.fm and MusicBrainz.</p>
                </div>
                <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center mb-4 text-2xl">🔗</div>
                    <h3 className="text-xl font-bold mb-2">Integration</h3>
                    <p className="text-gray-500 dark:text-gray-400">Seamlessly connects with your Navidrome library and Lidarr instance for easy requests.</p>
                </div>
                <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl flex items-center justify-center mb-4 text-2xl">⚡</div>
                    <h3 className="text-xl font-bold mb-2">Automated</h3>
                    <p className="text-gray-500 dark:text-gray-400">Admins can approve requests with one click, and MusicSeer handles the rest with Lidarr.</p>
                </div>
            </div>
        </div>
    );
}
