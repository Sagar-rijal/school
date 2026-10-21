import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the app root stable when this project is run inside the parent repository.
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
