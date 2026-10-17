import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Setelah verifikasi disetujui:
// 1. selfie disalin ke penyimpanan publik 'avatar' dan dipakai sebagai foto profil
//    bila profil belum punya foto,
// 2. foto KTP dihapus dari penyimpanan privat.
// Selfie di penyimpanan privat, nomor KTP, dan status verifikasi tetap tersimpan.
export async function GET(req: NextRequest) {
  const rahasia = process.env.CRON_SECRET;
  if (!rahasia || req.headers.get('authorization') !== `Bearer ${rahasia}`) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('verifikasi_ktp')
    .select('id, user_id, foto_ktp_url, foto_selfie_url')
    .eq('status', 'terverifikasi')
    .neq('foto_ktp_url', 'dihapus')
    .limit(200);
  if (error) {
    console.error('[hapus-ktp] gagal membaca data:', error.message);
    return NextResponse.json({ error: 'Gagal membaca data' }, { status: 500 });
  }

  let dihapus = 0;
  let gagal = 0;
  let gagalFotoProfil = 0;

  for (const r of data ?? []) {
    // 1. selfie menjadi foto profil
    const selfie = r.foto_selfie_url;
    if (typeof selfie === 'string' && selfie !== '' && selfie !== 'dihapus') {
      try {
        const { data: berkas, error: eUnduh } = await admin.storage.from('ktp').download(selfie);
        if (eUnduh || !berkas) throw new Error(eUnduh?.message ?? 'file kosong');
        const jalurAvatar = `${r.user_id}/profil.jpg`;
        const { error: eUnggah } = await admin.storage
          .from('avatar')
          .upload(jalurAvatar, berkas, { contentType: berkas.type || 'image/jpeg', upsert: true });
        if (eUnggah) throw new Error(eUnggah.message);
        const { data: pub } = admin.storage.from('avatar').getPublicUrl(jalurAvatar);
        const { error: eProfil } = await admin
          .from('profiles')
          .update({ avatar_url: pub.publicUrl })
          .eq('id', r.user_id)
          .or('avatar_url.is.null,avatar_url.eq.');
        if (eProfil) throw new Error(eProfil.message);
      } catch (e) {
        console.error('[hapus-ktp] gagal menyalin selfie', r.id, e instanceof Error ? e.message : e);
        gagalFotoProfil++;
      }
    }

    // 2. hapus foto KTP
    const ktp = r.foto_ktp_url;
    if (typeof ktp === 'string' && ktp !== '' && ktp !== 'dihapus') {
      const { error: eHapus } = await admin.storage.from('ktp').remove([ktp]);
      if (eHapus) {
        console.error('[hapus-ktp] gagal menghapus file', r.id, eHapus.message);
        gagal++;
        continue;
      }
    }
    const { error: eUbah } = await admin
      .from('verifikasi_ktp')
      .update({ foto_ktp_url: 'dihapus' })
      .eq('id', r.id);
    if (eUbah) {
      console.error('[hapus-ktp] gagal memperbarui baris', r.id, eUbah.message);
      gagal++;
    } else {
      dihapus++;
    }
  }
  return NextResponse.json({ ok: true, dihapus, gagal, gagalFotoProfil });
}