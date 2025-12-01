
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.salla.sa',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'omnicloudsolutions.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'saradatechnologiesltd.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.made-in-china.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
   webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only packages from client-side bundles
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@opentelemetry/exporter-trace-otlp-http': false,
        '@opentelemetry/sdk-trace-node': false,
        'firebase-admin': false,
        'gaxios': false,
        'google-auth-library': false,
        'google-gax': false,
        '@grpc/grpc-js': false,
      };
    }

    return config;
  },
};

export default nextConfig;
