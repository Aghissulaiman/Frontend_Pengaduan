/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dwngbmtcpvnjdqvrzzgl.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Tambahkan domain lain jika perlu
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;