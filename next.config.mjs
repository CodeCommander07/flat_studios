/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  output: 'standalone',

  // ✅ Image optimization: safe to keep caching
  images: {
    domains: [
      'cdn.discordapp.com',
      'www.roblox.com',
      'tr.rbxcdn.com',
      'yapton.vercel.app',
      'flat-studios.vercel.app',
    ],
    formats: ['image/avif', 'image/webp'],
    // ✅ CDN image caching is fine — only images
    minimumCacheTTL: 60 * 60 * 24,
  },

  // ✅ Disable caching for all dynamic content (pages + APIs)
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
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/cdn/image/:path*',
        destination: '/:path*',
      },
      {
        source: '/files/:path*',
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
