import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  trailingSlash: true,
  async headers() {
    return [
      {
        source: "/unseen.apk",
        headers: [
          {
            key: "Content-Disposition",
            value: "attachment; filename=\"unseen.apk\"",
          },
          {
            key: "Content-Type",
            value: "application/vnd.android.package-archive",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
