/** @type {import('next').NextConfig} */
const nextConfig = {
  // Erlaubt größere Foto-Uploads an die Server Actions / Route Handler.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
