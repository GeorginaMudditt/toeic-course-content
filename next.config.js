/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mark resend as server-only to prevent client-side bundling issues
  serverComponentsExternalPackages: ['resend'],
}

module.exports = nextConfig


