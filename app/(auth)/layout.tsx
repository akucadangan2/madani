'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  // Halaman login punya desain layar penuh sendiri (ilustrasi desa), tanpa panel samping
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[5fr_6fr]">
      <aside className="relative hidden overflow-hidden bg-ink-700 text-white lg:block">
        <div className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-primary-500" />
        <div className="absolute -right-2 top-[52%] h-56 w-56 rounded-full bg-secondary-500" />
        <div className="sticky top-0 flex h-screen flex-col justify-between p-12">
          <Link href="/" className="self-start rounded-xl bg-white px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/madani.png" alt="MADANI" className="h-9 w-auto" />
          </Link>
          <div className="relative max-w-md">
            <h2 className="text-5xl font-extrabold leading-[1.05] text-white">
              Masuk dengan kode WhatsApp. Tanpa password.
            </h2>
            <p className="mt-4 text-white/70">
              Satu akun untuk cari kerja, jualan, dan belanja di kecamatanmu.
            </p>
          </div>
          <p className="text-sm text-white/50">PT RHG Teknologi Indonesia</p>
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-col">
        <Link href="/" className="absolute left-5 top-5 z-10 lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/madani.png" alt="MADANI" className="h-8 w-auto" />
        </Link>
        {children}
      </main>
    </div>
  );
}