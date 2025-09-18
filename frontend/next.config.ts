import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/stream',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
