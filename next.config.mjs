/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Default do Next é 1mb — qualquer foto de celular ou áudio gravado
    // (upload de fotos, amostra de voz pra clonagem) já estoura isso e a
    // Server Action nem chega a rodar, só devolve 413 puro (bug real
    // encontrado em produção: fotos de verdade quase sempre passam de 1MB).
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
