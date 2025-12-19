import type { NextConfig } from "next";
import path from "path";

const emptyStub = path.resolve(__dirname, "stubs/empty.js");

const nextConfig: NextConfig = {
  // Alias test-only deps pulled in by pino/thread-stream so the bundler ignores them
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      tap: emptyStub,
      desm: emptyStub,
      fastbench: emptyStub,
      "pino-elasticsearch": emptyStub,
      "why-is-node-running": emptyStub,
      "thread-stream/test": emptyStub,
      "thread-stream/test/*": emptyStub,
    };
    return config;
  },
  // Silence Turbopack warning when a custom webpack config exists.
  turbopack: {},
};

export default nextConfig;
