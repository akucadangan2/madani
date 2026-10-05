'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, BellRing, CheckCircle2, X } from 'lucide-react';

type ToastData = { type: 'ok' | 'error' | 'info'; text: string };

export default function Toast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [msg, setMsg] = useState<ToastData | null>(null);

  // Baca ?ok= / ?error= lalu bersihkan dari URL
  useEffect(() => {
    const ok = params.get('ok');
    const err = params.get('error');
    if (!ok && !err) return;
    setMsg(err ? { type: 'error', text: err } : { type: 'ok', text: ok ?? '' });
    const next = new URLSearchParams(params.toString());
    next.delete('ok');
    next.delete('error');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  // Event dari komponen lain (mis. notifikasi pengajuan baru)
  useEffect(() => {
    function onEvt(e: Event) {
      const d = (e as CustomEvent<ToastData>).detail;
      if (d) setMsg(d);
    }
    window.addEventListener('admin-toast', onEvt);
    return () => window.removeEventListener('admin-toast', onEvt);
  }, []);

  // Hilang otomatis
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), msg.type === 'error' ? 7000 : 4500);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;

  const style =
    msg.type === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : msg.type === 'info'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-green-200 bg-green-50 text-green-800';
  const Icon = msg.type === 'error' ? AlertCircle : msg.type === 'info' ? BellRing : CheckCircle2;

  return (
    <div className="fixed right-4 top-20 z-[60] w-[calc(100%-2rem)] max-w-sm">
      <div role="status" className={`flex items-start gap-3 rounded-2xl border p-3.5 shadow-lg ${style}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="flex-1 text-sm font-medium">{msg.text}</p>
        <button type="button" onClick={() => setMsg(null)} aria-label="Tutup" className="opacity-60 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}