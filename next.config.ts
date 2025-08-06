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
        pathname: '/**',
      },
    ],
    
    dangerouslyAllowSVG: true,
    domains: ['apivcmd.thptchuyenhatinh.edu.vn'],
  },
  trailingSlash: false, 
};

export default nextConfig;
