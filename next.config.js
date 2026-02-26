const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack config (Next.js 16+ default bundler)
  turbopack: {
    resolveAlias: {
      // Stub out the canvas native addon — not needed in browser builds
      canvas: path.resolve(__dirname, "src/empty-canvas.js"),
    },
  },
  // Keep webpack config for non-Turbopack builds
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
      },
      {
        protocol: "https",
        hostname: "reaback.onrender.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async rewrites() {
    // Proxy API requests through the frontend domain so cookies are first-party.
    // This fixes third-party cookie blocking in Safari, Firefox, and Brave.
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4001";
    console.log("🔧 Next.js Rewrites: Proxying /api/* to", backendUrl);
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
