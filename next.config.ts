import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
    ],
    dangerouslyAllowSVG: true,
    deviceSizes: [320, 640, 768, 1024, 1200, 1920, 2048, 3840],
  },
  trailingSlash: false, 
};

export default nextConfig;
