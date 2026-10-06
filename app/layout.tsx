import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import './globals.css';
import SiteFooter from '@/components/site-footer';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MADANI - Berdaya, Sejahtera',
  description: 'Marketplace tenaga kerja & barang berbasis kecamatan',
};

export const viewport: Viewport = {
  themeColor: '#0C2A57',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}