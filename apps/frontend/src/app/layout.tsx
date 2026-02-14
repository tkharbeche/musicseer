import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'MusicSeer - Music Discovery & Request Manager',
    description: 'Open-source music discovery and request management for Lidarr and Navidrome',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100`}>
                <Providers>
                    <Navbar />
                    <main className="min-h-screen">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    )
}
