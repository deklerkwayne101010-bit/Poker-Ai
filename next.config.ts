import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  /* 'standalone' guarantees Next.js outputs a self-contained
     server + static assets directory that Vercel's builder always
     picks up correctly regardless of lockfile layout. */
  output: 'standalone',
};

export default nextConfig;
