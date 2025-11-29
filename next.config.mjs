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
      { protocol: 'https', hostname: 'rbxcdn.com' },
      { protocol: 'https', hostname: 't1.rbxcdn.com' },
      { protocol: 'https', hostname: 't2.rbxcdn.com' },
      { protocol: 'https', hostname: 't3.rbxcdn.com' },
      { protocol: 'https', hostname: 't4.rbxcdn.com' },
      { protocol: 'https', hostname: '*.flatstudios.net' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24,
    dangerouslyAllowSVG: false,
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
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      { source: '/cdn/image/:path*', destination: '/:path*', },
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
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'axios',
    ],
    webpackBuildWorker: true,
  },
};

export default nextConfig;
