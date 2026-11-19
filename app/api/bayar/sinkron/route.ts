import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sinkronkanRef, type RefBayar } from '@/lib/doku-sinkron';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Dipanggil aplikasi setelah halaman bayar ditutup: cek ke DOKU semua pembayaran milik pengguna yang masih menunggu. */
export async function POST(req: Request) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return NextResponse.json({ error: 'Belum login' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u, error: eu } = await anon.auth.getUser(token);
  if (eu || !u.user) return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
  const uid = u.user.id;

  const admin = createClient(url, (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sejak = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const refs: RefBayar[] = [];

  const { data: tops } = await admin
    .from('topup_saldo')
    .select('payment_ref')
    .eq('user_id', uid)
    .eq('status', 'pending')
    .gte('created_at', sejak)
    .limit(10);
  for (const t of tops ?? []) refs.push({ ref: String(t.payment_ref), topup: true });

  const { data: pes } = await admin.from('pesanan').select('id').eq('pembeli_id', uid).eq('status', 'menunggu_pembayaran').limit(20);
  const { data: tks } = await admin.from('tasks').select('id').eq('pemberi_kerja_id', uid).eq('status', 'proses').limit(20);
  const ids = [...(pes ?? []).map((p) => p.id), ...(tks ?? []).map((t) => t.id)];
  if (ids.length > 0) {
    const { data: trx } = await admin
      .from('transaksi')
      .select('payment_ref')
      .eq('payment_gateway', 'doku')
      .eq('status', 'pending')
      .in('referensi_id', ids)
      .gte('created_at', sejak)
      .limit(20);
    for (const t of trx ?? []) refs.push({ ref: String(t.payment_ref), topup: false });
  }

  let diperbarui = 0;
  for (const r of refs.slice(0, 10)) {
    if ((await sinkronkanRef(admin, r)) === 'ok') diperbarui += 1;
  }
  return NextResponse.json({ ok: true, dicek: refs.length, diperbarui });
}