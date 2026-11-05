'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingMadani from '@/components/loading-madani';

function Isi() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [aktif, setAktif] = useState(false);
  const tunda = useRef<ReturnType<typeof setTimeout> | null>(null);
  const batas = useRef<ReturnType<typeof setTimeout> | null>(null);

  function bersihkan() {
    if (tunda.current) clearTimeout(tunda.current);
    if (batas.current) clearTimeout(batas.current);
    tunda.current = null;
    batas.current = null;
  }

  // Halaman tujuan sudah tampil: sembunyikan loading.
  useEffect(() => {
    bersihkan();
    setAktif(false);
  }, [pathname, search]);

  useEffect(() => {
    function klik(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest('a');
      if (!a) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      const href = a.getAttribute('href') ?? '';
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith('/api/')) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      bersihkan();
      tunda.current = setTimeout(() => setAktif(true), 150);
      batas.current = setTimeout(() => setAktif(false), 10000);
    }
    document.addEventListener('click', klik, true);
    return () => {
      document.removeEventListener('click', klik, true);
      bersihkan();
    };
  }, []);

  if (!aktif) return null;
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[100] bg-white/85 backdrop-blur-sm">
      <LoadingMadani />
    </div>
  );
}

export default function LoadingNavigasi() {
  return (
    <Suspense fallback={null}>
      <Isi />
    </Suspense>
  );
}