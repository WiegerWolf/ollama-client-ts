import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode to prevent double rendering in development
  // This helps with e2e test stability and prevents element duplication
  reactStrictMode: false,
  
  // Other config options
  experimental: {
    // Optimize for better performance
    optimizeCss: true,
  }
};

export default nextConfig;
