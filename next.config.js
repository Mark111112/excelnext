/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 设置API路由的请求体大小限制
  experimental: {
    serverComponentsExternalPackages: ['xlsx', 'formidable'],
  }
}

module.exports = nextConfig 