import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Server-side environment variables guard
  serverExternalPackages: ["@google/genai"],
};

export default nextConfig;
