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
    ],
    dangerouslyAllowSVG: true,
  },
  
  webpack: (config, { isServer }) => {
   
    if (isServer) {
      config.resolve.fallback = {
   
        fs: false,            // File system module
        stream: false,        // Stream module
        tls: false,           // TLS (Transport Layer Security) module
        net: false,           // Network module
        zlib: false,          // Compression module (zlib)
        http: false,          // HTTP client/server module
        http2: false,         // HTTP/2 protocol module
        dns: false,           // DNS module
        os: false,            // Operating System module
        path: false,          // Path manipulation module
        querystring: false,   // Query string parsing module
        
        // crypto: false,
        // path: false,
        // util: false,
      };
    }

    return config;
  },

};

export default nextConfig;