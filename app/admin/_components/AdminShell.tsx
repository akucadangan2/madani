'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Bell,
  ExternalLink,
  LayoutDashboard,
  MapPin,
  Menu,
  Percent,
  Receipt,
  ShieldCheck,
  Store,
  Tags,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';

type Counts = { toko: number; ktp: number; penarikan: number; komplain: number };
type Item = { href: string; label: string; icon: LucideIcon; badge?: keyof Counts };

const NAV: { judul: string; items: Item[] }[] = [
  {
    judul: 'Utama',
    items: [{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    judul: 'Verifikasi',
    items: [
      { href: '/admin/toko', label: 'Toko', icon: Store, badge: 'toko' },
      { href: '/admin/verifikasi-ktp', label: 'Verifikasi KTP', icon: ShieldCheck, badge: 'ktp' },
    ],
  },
  {
    judul: 'Keuangan',
    items: [
      { href: '/admin/transaksi', label: 'Transaksi', icon: Receipt },
      { href: '/admin/pencairan-dana', label: 'Pencairan Dana', icon: Banknote, badge: 'penarikan' },
      { href: '/admin/komplain', label: 'Komplain', icon: AlertTriangle, badge: 'komplain' },
      { href: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
    ],
  },
  {
    judul: 'Data Master',
    items: [
      { href: '/admin/users', label: 'Pengguna', icon: Users },
      { href: '/admin/wilayah', label: 'Wilayah', icon: MapPin },
      { href: '/admin/kategori', label: 'Kategori', icon: Tags },
      { href: '/admin/bagi-hasil', label: 'Bagi Hasil', icon: Percent },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

function cap(n: number) {
  return n > 99 ? '99+' : String(n);
}

function Sidebar({
  pathname,
  counts,
  onNavigate,
}: {
  pathname: string;
  counts: Counts;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-ink-900 text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <Image src="/madani.png" alt="MADANI" width={36} height={36} className="rounded-lg bg-white p-0.5" />
        <div>
          <div className="font-display text-lg font-bold leading-none text-white">MADANI</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-white/50">Panel Admin</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {NAV.map((g) => (
          <div key={g.judul}>
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              {g.judul}
            </div>
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const aktif = pathname === it.href || pathname.startsWith(it.href + '/');
                const n = it.badge ? counts[it.badge] : 0;
                const Icon = it.icon;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      aktif ? 'bg-white/15 font-semibold text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span className="flex-1">{it.label}</span>
                    {n > 0 && (
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-ink-900">
                        {cap(n)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default function AdminShell({
  nama,
  counts,
  children,
}: {
  nama: string;
  counts: Counts;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [bell, setBell] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const total = counts.toko + counts.ktp + counts.penarikan + counts.komplain;
  const prevTotal = useRef(total);

  // Tutup drawer & dropdown saat pindah halaman
  useEffect(() => {
    setDrawer(false);
    setBell(false);
  }, [pathname]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBell(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Segarkan angka notifikasi tiap 30 detik
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, 30000);
    return () => clearInterval(t);
  }, [router]);

  // Toast kalau ada pengajuan baru
  useEffect(() => {
    if (total > prevTotal.current) {
      const baru = total - prevTotal.current;
      window.dispatchEvent(
        new CustomEvent('admin-toast', {
          detail: { type: 'info', text: `${baru} pengajuan baru menunggu persetujuan` },
        })
      );
    }
    prevTotal.current = total;
  }, [total]);

  const judul = ALL_ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + '/'))?.label ?? 'Admin';
  const inisial = nama.trim().charAt(0).toUpperCase() || 'A';

  const notif = [
    { key: 'toko', n: counts.toko, teks: `${counts.toko} toko menunggu verifikasi`, href: '/admin/toko', icon: Store },
    { key: 'ktp', n: counts.ktp, teks: `${counts.ktp} KTP menunggu verifikasi`, href: '/admin/verifikasi-ktp', icon: ShieldCheck },
    {
      key: 'penarikan',
      n: counts.penarikan,
      teks: `${counts.penarikan} permintaan pencairan dana`,
      href: '/admin/pencairan-dana',
      icon: Banknote,
    },
    {
      key: 'komplain',
      n: counts.komplain,
      teks: `${counts.komplain} komplain pesanan menunggu keputusan`,
      href: '/admin/komplain',
      icon: AlertTriangle,
    },
  ].filter((x) => x.n > 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar pathname={pathname} counts={counts} />
      </aside>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            <button
              type="button"
              onClick={() => setDrawer(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-4 z-10 text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar pathname={pathname} counts={counts} onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Buka menu"
            className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h2 className="font-display text-lg font-bold text-neutral-900">{judul}</h2>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/beranda"
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 sm:inline-flex"
            >
              <ExternalLink className="h-4 w-4" />
              Ke aplikasi
            </Link>

            {/* Lonceng notifikasi */}
            <div className="relative" ref={bellRef}>
              <button
                type="button"
                onClick={() => setBell((v) => !v)}
                aria-label={`Notifikasi, ${total} perlu tindakan`}
                className="relative rounded-full p-2.5 text-neutral-700 hover:bg-neutral-100"
              >
                <Bell className="h-5 w-5" />
                {total > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                    {cap(total)}
                  </span>
                )}
              </button>

              {bell && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
                  <div className="border-b border-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-900">
                    Perlu tindakan
                  </div>
                  {notif.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-neutral-500">
                      Semua beres, tidak ada yang menunggu.
                    </div>
                  ) : (
                    <ul>
                      {notif.map((n) => {
                        const Icon = n.icon;
                        return (
                          <li key={n.key}>
                            <Link href={n.href} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
                              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="flex-1 text-sm text-neutral-800">{n.teks}</span>
                              <span className="text-xs font-medium text-secondary-700">Tinjau</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-full bg-neutral-100 py-1 pl-1 pr-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white">
                {inisial}
              </span>
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-neutral-800 sm:block">
                {nama || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}