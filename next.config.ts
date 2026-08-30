import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // The service worker (public/sw.js) must never be cached by the
        // browser itself, so each new build's worker is picked up on the next
        // visit instead of a stale one lingering. Its own caching of the app is
        // handled inside the worker; this only governs the worker file.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
