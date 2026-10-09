import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/current-user';

export const dynamic = 'force-dynamic';

export default async function PublikLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-5">
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/madani.png" alt="MADANI" className="h-8 w-auto sm:h-9" />
          </Link>
          <div className="flex items-center gap-1">
            {user ? (
              <Link href="/beranda" className="rounded-full bg-ink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 sm:px-5 sm:text-[15px]">
                Ke beranda
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-full px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-neutral-100 sm:px-4 sm:text-[15px]">
                  Masuk
                </Link>
                <Link href="/register" className="rounded-full bg-ink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 sm:px-5 sm:text-[15px]">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
        <nav className="border-t border-neutral-100">
          <div className="mx-auto flex max-w-6xl gap-2 px-4 py-2 text-sm font-medium text-neutral-600 sm:px-5">
            <Link href="/lowongan" className="rounded-full bg-neutral-100 px-4 py-1.5 hover:bg-neutral-200">
              Lowongan kerja
            </Link>
            <Link href="/produk" className="rounded-full bg-neutral-100 px-4 py-1.5 hover:bg-neutral-200">
              Produk
            </Link>
          </div>
        </nav>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-neutral-200 py-6 text-sm text-neutral-500">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 px-4 sm:px-5">
          <span>© MADANI</span>
          <Link href="/privasi" className="hover:text-ink-700">Kebijakan Privasi</Link>
          <Link href="/syarat" className="hover:text-ink-700">Syarat</Link>
          <Link href="/kontak" className="hover:text-ink-700">Kontak</Link>
          <Link href="/hapus-akun" className="hover:text-ink-700">Hapus Akun</Link>
        </div>
      </footer>
    </div>
  );
}