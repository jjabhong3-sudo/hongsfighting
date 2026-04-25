import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 이미지 최적화 비활성화
  images: {
    unoptimized: true,
  },

  // Turbopack 루트 설정 (lockfile 경고 제거)
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
