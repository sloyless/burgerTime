/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['antd'],
  experimental: {
    optimizePackageImports: ['antd', '@fortawesome/free-solid-svg-icons'],
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: '/burger/:slug',
          destination: '/burger/[slug].html',
        },
      ],
    };
  },
  images: {
    // Required for Firebase Hosting without the Next.js SSR Cloud Function.
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
