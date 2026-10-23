'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Menandai pengguna "ready" selama halaman terbuka (ping tiap 90 detik). */
export default function PingAktif() {
  useEffect(() => {
    const supabase = createClient();
    const ping = () => {
      if (document.visibilityState === 'visible') {
        void supabase.rpc('app_ping').then(
          () => undefined,
          () => undefined
        );
      }
    };
    ping();
    const timer = setInterval(ping, 90_000);
    document.addEventListener('visibilitychange', ping);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', ping);
    };
  }, []);
  return null;
}