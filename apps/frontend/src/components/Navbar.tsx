import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                MusicSeer
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link href="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                                Home
                            </Link>
                            <Link href="/discovery" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                Discovery
                            </Link>
                            <Link href="/requests" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                Requests
                            </Link>
                            <Link href="/admin" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                Admin
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
