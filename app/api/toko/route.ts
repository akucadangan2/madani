import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json(
        { success: false, error: 'Sesi habis, silakan login ulang' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const nama = String(body.nama ?? '').trim();
    const deskripsi = String(body.deskripsi ?? '').trim() || null;
    const kecamatanId = String(body.kecamatan_id ?? '');

    if (!nama || !kecamatanId) {
      return NextResponse.json(
        { success: false, error: 'Nama toko dan kecamatan wajib diisi' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from('toko').insert({
      penjual_id: current.id,
      nama_toko: nama,
      deskripsi,
      kecamatan_id: kecamatanId,
      status_verifikasi: 'menunggu',
    });

    if (error) {
      console.error('[api/toko] insert gagal:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    revalidatePath('/toko-saya');
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[api/toko] exception:', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Terjadi kesalahan di server' },
      { status: 500 }
    );
  }
}