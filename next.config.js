/** @type {import('next').NextConfig} */
const firebaseAuthHandlerHost = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`
  : 'burgertime-48011.firebaseapp.com';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['antd'],
  experimental: {
    optimizePackageImports: ['antd', '@fortawesome/free-solid-svg-icons'],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/__/auth/:path*',
          destination: `https://${firebaseAuthHandlerHost}/__/auth/:path*`,
        },
      ],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

module.exports = nextConfig;
