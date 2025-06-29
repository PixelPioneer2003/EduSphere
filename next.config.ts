import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["utfs.io"],
  },
  eslint: {
    ignoreDuringBuilds: true, // <-- Disable ESLint during next build
  },
  
};

export default nextConfig;
