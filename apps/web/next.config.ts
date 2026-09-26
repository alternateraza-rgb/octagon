import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@octacore/ui"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
