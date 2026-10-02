import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  distDir: '.next', // default output folder
};

export default nextConfig;
