import type { NextConfig } from "next";
import path from "path";

const emptyStub = path.resolve(__dirname, "stubs/empty.js");

const nextConfig: NextConfig = {
  // Keep webpack as the fallback; add aliases for turbopack and webpack to ignore test-only deps
  experimental: {
    turbo: {
      resolveAlias: {
        tap: emptyStub,
        desm: emptyStub,
        "fastbench": emptyStub,
        "pino-elasticsearch": emptyStub,
        "why-is-node-running": emptyStub,
        "thread-stream/test": emptyStub,
        "thread-stream/test/*": emptyStub,
      },
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      tap: emptyStub,
      desm: emptyStub,
      "fastbench": emptyStub,
      "pino-elasticsearch": emptyStub,
      "why-is-node-running": emptyStub,
      "thread-stream/test": emptyStub,
      "thread-stream/test/*": emptyStub,
    };
    return config;
  },
};

export default nextConfig;
