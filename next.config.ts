import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'apivcmd.thptchuyenhatinh.edu.vn',
        port: '',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'media.vanchuongmandam.com',
        port: '',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'transparenttextures.com',
        port: '',
        pathname: 'patterns/**',
      },
    ],
    dangerouslyAllowSVG: true,
    deviceSizes: [320, 640, 768, 1024, 1200, 1920, 2048, 3840],
  },
  trailingSlash: false,
  generateBuildId: async () => {
    // This fixes "Failed to find Server Action" error when multiple pods/containers are running
    // or when client has old version cached.
    if (process.env.BUILD_ID) {
      return process.env.BUILD_ID;
    }
    return `${new Date().getTime()}`; // Fallback to timestamp if no env var
  },
};

export default nextConfig;
