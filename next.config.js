// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "beyvohpstvylkirsebwj.supabase.co",
      },
    ],
    domains: ["https://beyvohpstvylkirsebwj.supabase.co"],
  },
};

module.exports = nextConfig;
