/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['antd'],
  // Hosting SSR: keep Admin SDK external (webpack build — see scripts/wrap-next-bin-for-hosting.sh).
  serverExternalPackages: ['firebase-admin'],
  experimental: {
    optimizePackageImports: ['antd', '@fortawesome/free-solid-svg-icons'],
  },
  images: {
    // Avoids an extra Hosting image-optimization Cloud Function on Firebase.
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
