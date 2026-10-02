/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  serverExternalPackages: ["mysql2"],
  // Sandboxed/remote dev previews are served from a proxied hostname.
  allowedDevOrigins: ["*.e2b.app", "*.app.github.dev", "*.gitpod.io"],
};

module.exports = nextConfig;
