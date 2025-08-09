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
        pathname: '/media/**', // Cụ thể hơn
      },
    ],
    dangerouslyAllowSVG: true,
    // domains: ['apivcmd.thptchuyenhatinh.edu.vn'], // Đã lỗi thời, remotePatterns tốt hơn
  },
  trailingSlash: false, 
};

export default nextConfig;
