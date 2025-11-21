import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// Bundle analyzer configuration (run with ANALYZE=true npm run build)
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */

  turbopack: {
    // Fix: Specify correct workspace root to silence lockfile warning
    // This tells Turbopack to use this directory as the root instead of inferring from multiple lockfiles
    root: __dirname,
  },
};

export default withBundleAnalyzer(nextConfig);
