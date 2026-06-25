import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'qa-req.vercel.app',
        process.env.NEXT_PUBLIC_APP_URL ?? '',
      ].filter(Boolean),
    },
  },
}

export default nextConfig
