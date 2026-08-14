/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}
module.exports = nextConfig

