import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buatCheckout } from '@/lib/doku';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.madaniberdaya.com';

type Baris = { ref: string; jumlah: number | string };

export async function POST(req: Request) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return NextResponse.json({ error: 'Belum login' }, { status: 401 });

  let isi: { jenis?: string; id?: string } = {};
  try {
    isi = (await req.json()) as typeof isi;
  } catch {
    /* body kosong */
  }
  const { jenis, id } = isi;
  if ((jenis !== 'pesanan' && jenis !== 'task') || !id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const { data: u, error: eu } = await sb.auth.getUser(token);
  if (eu || !u.user) return NextResponse.json({ error: 'Sesi tidak valid, silakan masuk lagi' }, { status: 401 });

  const { data, error } =
    jenis === 'pesanan'
      ? await sb.rpc('rpc_mulai_bayar_pesanan', { p_pesanan_id: id })
      : await sb.rpc('rpc_mulai_bayar_task', { p_task_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const baris = (Array.isArray(data) ? data[0] : data) as Baris | undefined;
  if (!baris?.ref) return NextResponse.json({ error: 'Gagal menyiapkan pembayaran' }, { status: 500 });

  try {
    const { url } = await buatCheckout({
      invoice: baris.ref,
      jumlah: Number(baris.jumlah),
      callbackUrl: `${SITE}/bayar/selesai?ref=${encodeURIComponent(baris.ref)}`,
    });
    return NextResponse.json({ url, ref: baris.ref });
  } catch (e) {
    const pesan = e instanceof Error ? e.message : String(e);
    console.error('[doku] /api/bayar gagal:', pesan);
    return NextResponse.json({ error: pesan }, { status: 502 });
  }
}