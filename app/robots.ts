import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.madaniberdaya.com').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/app', '/api', '/kecamatan', '/bayar'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}