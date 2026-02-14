import Link from 'next/link';

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6">
            <div className="max-w-4xl w-full text-center">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4">
                    Discover Your Next <span className="text-indigo-600">Favorite Artist</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
                    MusicSeer connects your Navidrome library with global trends and Lidarr for a seamless discovery experience.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Link href="/discovery" className="group p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all">
                        <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Trending Now</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            See what the world is listening to right now via Last.fm.
                        </p>
                    </Link>

                    <Link href="/discovery" className="group p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all">
                        <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Similar to You</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Recommendations based on your unique listening history.
                        </p>
                    </Link>

                    <Link href="/requests" className="group p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all">
                        <div className="h-12 w-12 bg-pink-100 dark:bg-pink-900/50 rounded-lg flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                            <svg className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Track Requests</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Manage and track your music requests from start to finish.
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
