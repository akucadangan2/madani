import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sinkronkanRef, type RefBayar } from '@/lib/doku-sinkron';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Cek ke DOKU semua pembayaran yang masih pending (30 hari terakhir). Dilindungi CRON_SECRET. */
export async function GET(req: Request) {
  const rahasia = process.env.CRON_SECRET;
  if (!rahasia || req.headers.get('authorization') !== `Bearer ${rahasia}`) {
    return NextResponse.json({ error: 'Tidak berwenang' }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const sejak = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const refs: RefBayar[] = [];

  const { data: tops } = await admin.from('topup_saldo').select('payment_ref').eq('status', 'pending').gte('created_at', sejak).limit(100);
  for (const t of tops ?? []) refs.push({ ref: String(t.payment_ref), topup: true });

  const { data: trx } = await admin
    .from('transaksi')
    .select('payment_ref')
    .eq('payment_gateway', 'doku')
    .eq('status', 'pending')
    .gte('created_at', sejak)
    .limit(100);
  for (const t of trx ?? []) refs.push({ ref: String(t.payment_ref), topup: false });

  const hasil: Record<string, string> = {};
  for (const r of refs) hasil[r.ref] = await sinkronkanRef(admin, r);
  return NextResponse.json({ dicek: refs.length, hasil });
}