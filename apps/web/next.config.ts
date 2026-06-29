import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@expat-atlas/ui", "@expat-atlas/types"],
};

export default nextConfig;
