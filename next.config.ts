import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// Bundle analyzer configuration (run with ANALYZE=true npm run build)
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */

  // Disable dev indicator during E2E tests
  devIndicators: {
    buildActivity: false, // Hide build activity indicator
    appIsrStatus: false,  // Hide ISR status indicator
  },

  turbopack: {
    // Fix: Specify correct workspace root to silence lockfile warning
    // This tells Turbopack to use this directory as the root instead of inferring from multiple lockfiles
    root: __dirname,
  },
};

export default withBundleAnalyzer(nextConfig);
