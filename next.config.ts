import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Pin Turbopack root to this directory so Vercel's lockfile
     root-detection does not pick up the parent home dir. */
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
