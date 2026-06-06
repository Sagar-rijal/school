import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // When your React app asks for this path...
        source: '/api/v1/:path*',
        // Next.js will secretly forward it to your Dev Tunnel!
        destination: 'https://9v1s3gvk-8081.inc1.devtunnels.ms/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;