/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Alias `canvas` to an empty stub so pdfjs-dist doesn't break SSR/Turbopack
  // (pdfjs-dist tries require("canvas") for Node-side rendering; we don't need it in the browser)
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: "./canvas-stub.js",
    },
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
