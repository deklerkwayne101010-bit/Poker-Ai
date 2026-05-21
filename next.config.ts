import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Turbopack is used by `next dev` only (dev-only, not in builds) */
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
