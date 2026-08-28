import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        // Scoped to this project's own Cloudinary folder, not every account.
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
