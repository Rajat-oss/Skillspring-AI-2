/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://0.0.0.0:8000/:path*',
      },
    ]
  },
}

export default nextConfig
