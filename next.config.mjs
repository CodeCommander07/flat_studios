/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
     return [
       {
         source: '/cdn/image/:path*',
         destination: '/:path*', // points to /public/image/*
       },
     ];
   },
images: {
  domains: ['cdn.discordapp.com', 'www.roblox.com', 'tr.rbxcdn.com'],
},
};

export default nextConfig;
