/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['antd'],
  // Hosting SSR: keep Admin SDK external; avoid bundling client Firebase into the server graph.
  serverExternalPackages: ['firebase-admin', 'firebase', '@firebase/app', '@firebase/firestore'],
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
