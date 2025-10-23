/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true, // Enables gzip/brotli compression automatically
  poweredByHeader: false, // Minor security + speed gain
  swcMinify: true, // Use SWC instead of Terser for faster builds
  output: 'standalone', // Makes Vercel lambdas smaller and faster to start

  // ✅ Use modern formats for images and allow your existing domains
  images: {
    domains: [
      'cdn.discordapp.com',
      'www.roblox.com',
      'tr.rbxcdn.com',
      'flat-studios.vercel.app',
    ],
    formats: ['image/avif', 'image/webp'], // much smaller and faster
    minimumCacheTTL: 60 * 60 * 24, // 1 day caching on CDN
  },

  // ✅ Useful for your static routes & API endpoints
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // ✅ Keep your rewrites
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

  // ✅ Experimental compiler-level optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion', 'axios'],
    webpackBuildWorker: true,
  },
};

export default nextConfig;
