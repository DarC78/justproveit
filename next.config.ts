import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  return {
    output: phase === PHASE_DEVELOPMENT_SERVER ? undefined : "export",
    images: {
      unoptimized: true,
    },
  };
};

export default nextConfig;
