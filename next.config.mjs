/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
      { protocol: 'https', hostname: 'www.roblox.com' },
      { protocol: 'https', hostname: 'tr.rbxcdn.com' },
      { protocol: 'https', hostname: 'yapton.vercel.app' },
      { protocol: 'https', hostname: 'flat-studios.vercel.app' },
      { protocol: 'https', hostname: 'yapton.flatstudios.net' },
      { protocol: 'https', hostname: 'test.flatstudios.net' },
      { protocol: 'https', hostname: 'dev.flatstudios.net' },
      { protocol: 'https', hostname: 'server.flatstudios.net' },
    ],
    formats: ['image/avif', 'image/webp', 'image/png', 'image/jpeg'],
    minimumCacheTTL: 60 * 60 * 24,
  },

  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      {
        source: '/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/cdn/image/:path*',
        destination: '/api/cdn/:path*',
      },
      {
        source: '/files/:path*',
        destination: '/api/files/:path*',
      },
      {
        source: '/storage/:path*',
        destination: '/api/files/:path*',
      },
    ];
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion', 'axios'],
    webpackBuildWorker: true,
  },
};

export default nextConfig;
