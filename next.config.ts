import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Prevent ESLint errors/warnings from failing Netlify and CI production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is verified via npm run typecheck
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
