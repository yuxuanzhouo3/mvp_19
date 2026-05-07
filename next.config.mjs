// 打印内存占用：每 5 秒打印一次
setInterval(() => {
  const mem = process.memoryUsage();
  console.log('===== 内存使用 =====');
  console.log('已使用 :', (mem.heapUsed / 1024 / 1024).toFixed(2), 'MB');
  console.log('总分配 :', (mem.heapTotal / 1024 / 1024).toFixed(2), 'MB');
  console.log('==================\n');
}, 5000);

import path from "node:path"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: "standalone",
  // 这些包只在服务端使用
  serverExternalPackages: ['@cloudbase/node-sdk'],
  // 增加Server Actions请求体大小限制（默认1MB，广告文件可能更大）
  serverActions: {
    bodySizeLimit: '50mb',
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(process.cwd()),
    }
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, path: false, stream: false, crypto: false,
        os: false, net: false, tls: false, child_process: false,
        'fs/promises': false,
      }
    }
    return config
  },
}

export default nextConfig
