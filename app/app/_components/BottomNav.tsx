'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, ShoppingBag, MessageCircle, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const TABS = [
  { href: '/beranda', label: 'Beranda', icon: Home, also: ['/toko-saya', '/saldo'] },
  { href: '/kerja', label: 'Kerja', icon: Briefcase, also: [] as string[] },
  { href: '/marketplace', label: 'Belanja', icon: ShoppingBag, also: [] as string[] },
  { href: '/chat', label: 'Chat', icon: MessageCircle, also: [] as string[] },
  { href: '/profil', label: 'Akun', icon: User, also: [] as string[] },
];

function isActive(path: string, base: string) {
  return path === base || path.startsWith(base + '/');
}

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-ink-700">
      {n > 9 ? '9+' : n}
    </span>
  );
}

export default function BottomNav() {
  // Buang prefix /app kalau ada (akibat rewrite), supaya cocok dengan href di atas.
  const path = (usePathname() ?? '').replace(/^\/app(?=\/|$)/, '');
  const [belumDibaca, setBelumDibaca] = useState(0);

  useEffect(() => {
    let mati = false;
    const supabase = createClient();

    async function muat() {
      const { data } = await supabase.rpc('rpc_jumlah_belum_dibaca');
      if (!mati && data !== null && data !== undefined) setBelumDibaca(Number(data) || 0);
    }

    muat();
    // Cek ulang sebentar setelah pindah halaman (mis. setelah membuka ruang chat)
    const cepat = setTimeout(muat, 1500);
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') muat();
    }, 15000);

    return () => {
      mati = true;
      clearTimeout(cepat);
      clearInterval(t);
    };
  }, [path]);

  if (path === '/pilih-peran') return null;

  return (
    <nav aria-label="Menu utama" className="fixed inset-x-0 bottom-3 z-30 px-4">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-full bg-ink-700 p-1.5 shadow-lg shadow-ink-900/25">
        {TABS.map((tab) => {
          const active = isActive(path, tab.href) || tab.also.some((a) => isActive(path, a));
          const Icon = tab.icon;
          const n = tab.href === '/chat' ? belumDibaca : 0;

          return active ? (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current="page"
              className="flex items-center gap-2 rounded-full bg-primary-400 px-4 py-2.5 text-sm font-semibold text-ink-900"
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                <Badge n={n} />
              </span>
              {tab.label}
            </Link>
          ) : (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={n > 0 ? `${tab.label}, ${n} pesan belum dibaca` : tab.label}
              className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 hover:text-white"
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                <Badge n={n} />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}