/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['antd'],
  // Firebase Hosting SSR: webpack build (scripts/wrap-next-bin-for-hosting.sh) + external Admin SDK.
  serverExternalPackages: ['firebase-admin'],
  experimental: {
    optimizePackageImports: ['antd', '@fortawesome/free-solid-svg-icons'],
  },
  images: {
    unoptimized: true,
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
