import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'route.ts', 'route.js'],
};

export default nextConfig;
