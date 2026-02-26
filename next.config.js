/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow up to 50 MB request bodies in API route handlers and middleware.
  // The default (10 MB) truncates large image upload batches, causing the
  // backend to receive an incomplete multipart stream → ECONNRESET.
  middlewareClientMaxBodySize: 50 * 1024 * 1024, // 50 MB

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
