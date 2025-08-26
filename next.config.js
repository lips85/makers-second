/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 웹팩 설정으로 환경 변수 처리
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 클라이언트 사이드에서 환경 변수를 런타임에 로딩
      config.plugins.push(
        new (require("webpack").DefinePlugin)({
          "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(
            process.env.NEXT_PUBLIC_SUPABASE_URL
          ),
          "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ),
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
