import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "photos-api-a5uw.onrender.com",
      },
      {
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
