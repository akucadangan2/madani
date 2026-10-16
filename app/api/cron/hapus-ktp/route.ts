import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Menghapus foto KTP dan selfie dari penyimpanan setelah verifikasi disetujui.
// Nomor KTP dan status verifikasi tetap tersimpan sebagai catatan.
export async function GET(req: NextRequest) {
  const rahasia = process.env.CRON_SECRET;
  if (!rahasia || req.headers.get('authorization') !== `Bearer ${rahasia}`) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await admin
    .from('verifikasi_ktp')
    .select('id, foto_ktp_url, foto_selfie_url')
    .eq('status', 'terverifikasi')
    .neq('foto_ktp_url', 'dihapus')
    .limit(200);
  if (error) {
    console.error('[hapus-ktp] gagal membaca data:', error.message);
    return NextResponse.json({ error: 'Gagal membaca data' }, { status: 500 });
  }

  let dihapus = 0;
  let gagal = 0;
  for (const r of data ?? []) {
    const jalur = [r.foto_ktp_url, r.foto_selfie_url].filter(
      (p): p is string => typeof p === 'string' && p !== '' && p !== 'dihapus',
    );
    if (jalur.length > 0) {
      const { error: eHapus } = await admin.storage.from('ktp').remove(jalur);
      if (eHapus) {
        console.error('[hapus-ktp] gagal menghapus file', r.id, eHapus.message);
        gagal++;
        continue;
      }
    }
    const { error: eUbah } = await admin
      .from('verifikasi_ktp')
      .update({ foto_ktp_url: 'dihapus', foto_selfie_url: 'dihapus' })
      .eq('id', r.id);
    if (eUbah) {
      console.error('[hapus-ktp] gagal memperbarui baris', r.id, eUbah.message);
      gagal++;
    } else {
      dihapus++;
    }
  }
  return NextResponse.json({ ok: true, dihapus, gagal });
}