import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// Bundle analyzer configuration (run with ANALYZE=true npm run build)
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withBundleAnalyzer(nextConfig);
