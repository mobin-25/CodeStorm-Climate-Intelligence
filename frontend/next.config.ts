import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/health",
        destination: `${BACKEND_URL}/health`,
      },
      {
        source: "/api/weather/:path*",
        destination: `${BACKEND_URL}/api/weather/:path*`,
      },
      {
        source: "/api/air-quality/:path*",
        destination: `${BACKEND_URL}/api/air-quality/:path*`,
      },
      {
        source: "/api/climate-risk/:path*",
        destination: `${BACKEND_URL}/api/climate-risk/:path*`,
      },
      {
        source: "/api/historical/:path*",
        destination: `${BACKEND_URL}/api/historical/:path*`,
      },
      {
        source: "/api/forecast/:path*",
        destination: `${BACKEND_URL}/api/forecast/:path*`,
      },
    ];
  },
};

export default nextConfig;
