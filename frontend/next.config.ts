import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  output: "export",
  // Optional: Disable image optimization if not using a custom loader for static exports
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
