import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Django requires trailing slashes; prevent Vercel from stripping them before the proxy sees them
  trailingSlash: true,
};

export default nextConfig;
