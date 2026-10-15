import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.madaniberdaya.com').replace(/\/$/, '');

const HALAMAN = [
  '/',
  '/lowongan',
  '/produk',
  '/faq',
  '/kontak',
  '/privasi',
  '/syarat',
  '/refund',
  '/hapus-akun',
  '/login',
  '/register',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return HALAMAN.map((p) => ({
    url: `${BASE}${p}`,
    priority: p === '/' ? 1 : 0.6,
  }));
}