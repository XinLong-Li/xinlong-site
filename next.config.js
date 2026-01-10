/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow LAN/mobile devices to load dev assets when using your local IP
  experimental: {
    allowedDevOrigins: ["http://192.168.56.1:3000", "http://localhost:3000"],
  },
};
module.exports = nextConfig;
