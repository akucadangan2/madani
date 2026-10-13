import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifikasiNotifikasi } from '@/lib/doku';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET = '/api/doku/notifikasi';

type Notif = {
  order?: { invoice_number?: string; amount?: number | string };
  transaction?: { status?: string };
};

export async function POST(req: Request) {
  const body = await req.text();

  if (!verifikasiNotifikasi({ headers: req.headers, target: TARGET, body })) {
    console.warn('[doku] notifikasi ditolak: tanda tangan tidak cocok');
    return NextResponse.json({ error: 'Tanda tangan tidak valid' }, { status: 401 });
  }

  let j: Notif;
  try {
    j = JSON.parse(body) as Notif;
  } catch {
    return NextResponse.json({ error: 'Body bukan JSON' }, { status: 400 });
  }

  const ref = j.order?.invoice_number;
  const status = String(j.transaction?.status ?? '').toUpperCase();

  if (!ref) {
    console.error('[doku] notifikasi tanpa invoice_number', body.slice(0, 500));
    return NextResponse.json({ ok: true });
  }
  // FAILED diabaikan: pembeli masih bisa mencoba metode lain sebelum kedaluwarsa.
  if (status !== 'SUCCESS') return NextResponse.json({ ok: true, diabaikan: status });

  const n = Number(j.order?.amount);
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await admin.rpc('rpc_doku_lunas', {
    p_ref: ref,
    p_jumlah: Number.isFinite(n) ? n : null,
  });
  if (error) {
    console.error('[doku] rpc_doku_lunas error', ref, error.message);
    return NextResponse.json({ error: 'Gagal memproses' }, { status: 500 }); // DOKU akan kirim ulang
  }
  if (data !== 'ok' && data !== 'sudah') {
    console.error('[doku] PERLU DICEK MANUAL', ref, data); // uang masuk tapi pesanan tidak bisa ditandai
  }
  return NextResponse.json({ ok: true, hasil: data });
}