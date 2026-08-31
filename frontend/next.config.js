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
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ich-meds-healthcare-production-8cf7.up.railway.app'
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}
module.exports = nextConfig

