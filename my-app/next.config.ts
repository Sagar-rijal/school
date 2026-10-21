import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root: a stray package-lock.json in the parent folder made
  // Turbopack treat the whole school/ directory as the app root
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
