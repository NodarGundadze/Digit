import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root (a stray lockfile exists in the home dir).
  turbopack: { root: path.resolve() },
  // Keep the Prisma client + libSQL driver as Node externals so the native
  // binding is not bundled by the server compiler.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@libsql/client",
  ],
  images: {
    // Demo avatars come from Unsplash / DiceBear.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
