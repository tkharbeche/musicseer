/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    },
    images: {
        domains: ['lastfm.freetls.fastly.net', 'www.last.fm'],
    },
}

module.exports = nextConfig
