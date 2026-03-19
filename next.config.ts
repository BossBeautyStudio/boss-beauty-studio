import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pas de config complexe en V1 — on garde ça simple

  // ESLint désactivé pendant le build Vercel — aucun .eslintrc configuré
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
