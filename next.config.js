/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  async rewrites() {
    // Halaman aplikasi ada di folder app/app/*, tapi URL-nya dipakai tanpa prefix /app.
    const sections = 'beranda|chat|kerja|marketplace|pilih-peran|profil|saldo|toko-saya';
    return [
      { source: `/:section(${sections})`, destination: '/app/:section' },
      { source: `/:section(${sections})/:path*`, destination: '/app/:section/:path*' },
    ];
  },
};

module.exports = nextConfig;