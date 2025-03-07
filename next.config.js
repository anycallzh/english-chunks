/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_MODEL: process.env.NEXT_PUBLIC_MODEL,
    NEXT_PUBLIC_ENGLISH_LEVEL: process.env.NEXT_PUBLIC_ENGLISH_LEVEL,
  },
}

module.exports = nextConfig
