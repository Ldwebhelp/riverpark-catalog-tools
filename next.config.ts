import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure webpack to handle postgres library properly
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't include postgres on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        perf_hooks: false,
      };
    }
    return config;
  },
};

export default nextConfig;
