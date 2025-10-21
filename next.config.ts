import type { NextConfig } from "next";

// Bundle analyzer configuration (run with ANALYZE=true npm run build)
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withBundleAnalyzer(nextConfig);
