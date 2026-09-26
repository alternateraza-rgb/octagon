import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@octacore/ui"],
  images: {
    // Cloudflare has no built-in Next image optimizer; template photos use their own Unsplash loader.
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;

// Gives `next dev` access to Cloudflare bindings.
initOpenNextCloudflareForDev();
