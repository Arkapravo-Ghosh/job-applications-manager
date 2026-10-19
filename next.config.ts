import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Isolate verification builds without disturbing an existing dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
