import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Desactiva ESLint durante el build de producción
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Opcional: también puedes ignorar errores de TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
