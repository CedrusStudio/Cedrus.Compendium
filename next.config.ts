import type { NextConfig } from "next";
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';
import path from 'path';

const nextConfig: NextConfig = {
  // The repository maintains its own shared developer instructions.
  agentRules: false,
  reactCompiler: { compilationMode: 'annotation' },
  cacheComponents: true,
  partialPrefetching: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
  turbopack: {
    root: path.resolve(__dirname)
  },
};

export default nextConfig;
