export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
                <h1 className="text-4xl font-bold text-center mb-4">
                    Welcome to MusicSeer
                </h1>
                <p className="text-center text-lg text-gray-600 dark:text-gray-400">
                    Open-source music discovery and request management
                </p>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 border rounded-lg">
                        <h2 className="text-xl font-semibold mb-2">Trending Now</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Discover globally trending artists
                        </p>
                    </div>
                    <div className="p-6 border rounded-lg">
                        <h2 className="text-xl font-semibold mb-2">Similar to You</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Personalized recommendations
                        </p>
                    </div>
                    <div className="p-6 border rounded-lg">
                        <h2 className="text-xl font-semibold mb-2">Request Music</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Add artists to your Lidarr
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}
