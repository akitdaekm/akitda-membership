import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingIncludes: {
    "/api/register": ["./node_modules/pdf-parse/**/*"],
  },
};

export default nextConfig;
