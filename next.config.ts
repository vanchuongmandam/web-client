import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['apivcmd.thptchuyenhatinh.edu.vn'],
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
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    loader: 'default',
    unoptimized: false,
  },

};

export default nextConfig;
