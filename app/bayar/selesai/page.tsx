import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Maskot } from '@/components/maskot';
import { sinkronkanRef } from '@/lib/doku-sinkron';

export const metadata = { title: 'Pembayaran diproses | MADANI' };
export const dynamic = 'force-dynamic';

export default async function BayarSelesai({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  // Saat DOKU mengalihkan ke halaman ini, cek statusnya sekarang juga (cadangan bila notifikasi terlambat).
  if (ref && /^(MDN|TOP)-[A-Za-z0-9-]{4,40}$/.test(ref)) {
    try {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      await sinkronkanRef(admin, { ref, topup: ref.startsWith('TOP-') });
    } catch (e) {
      console.error('[doku] sinkron di halaman selesai gagal', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <Maskot pose="jempol" className="h-40 w-auto" />
      <h1 className="font-display mt-6 text-2xl font-extrabold text-ink-800">Terima kasih!</h1>
      <p className="mt-2 text-ink-700">
        Pembayaranmu sedang kami proses, biasanya hanya beberapa detik. Kembali ke aplikasi MADANI,
        lalu tarik layar ke bawah untuk menyegarkan status.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-primary-500 px-6 py-3 font-bold text-white"
      >
        Ke beranda
      </Link>
    </main>
  );
}