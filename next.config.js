/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // 将服务器端环境变量暴露给客户端
    API_KEY: process.env.API_KEY,
    API_BASE_URL: process.env.API_BASE_URL,
    MODEL: process.env.MODEL,
    ENGLISH_LEVEL: process.env.ENGLISH_LEVEL,
  },
}

module.exports = nextConfig
