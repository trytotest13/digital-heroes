import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Winner proof screenshots are uploaded through server actions,
  // so the request body limit needs to exceed the default 1 MB.
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
