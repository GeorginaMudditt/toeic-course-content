/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: serverComponentsExternalPackages is not available in Next.js 14.0.4
  // If needed in the future, use experimental.serverComponentsExternalPackages
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: ['**/node_modules/**', '**/data/english-outside-class.json'],
      }
    }
    return config
  },
}

module.exports = nextConfig


