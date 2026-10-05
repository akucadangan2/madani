'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function buatToko(
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  console.log('[buatToko] dipanggil');

  try {
    const current = await getCurrentUser();
    if (!current) return { success: false, error: 'Sesi habis, silakan login ulang' };

    const nama = (formData.get('nama') as string)?.trim();
    const deskripsi = (formData.get('deskripsi') as string)?.trim() || null;
    const kecamatanId = formData.get('kecamatan_id') as string;

    if (!nama || !kecamatanId) {
      return { success: false, error: 'Nama toko dan kecamatan wajib diisi' };
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
      console.error('[buatToko] insert gagal:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/toko-saya');
    return { success: true };
  } catch (e) {
    console.error('[buatToko] exception:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Terjadi kesalahan di server' };
  }
}

export async function buatProduk(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) return;

  const supabase = await createClient();
  const { data: toko } = await supabase.from('toko').select('id').eq('penjual_id', current.id).single();
  if (!toko) return;

  const nama = (formData.get('nama') as string)?.trim();
  const deskripsi = (formData.get('deskripsi') as string)?.trim();
  const harga = Number(formData.get('harga'));
  const stok = Number(formData.get('stok'));
  const kategoriId = formData.get('kategori_id') as string;
  if (!nama || !harga) return;

  await supabase.from('produk').insert({
    toko_id: toko.id,
    nama,
    deskripsi,
    harga,
    stok,
    kategori_id: kategoriId || null,
    status: 'aktif',
  });

  redirect('/toko-saya/produk');
}

export async function hapusProduk(produkId: string) {
  const supabase = await createClient();
  await supabase.from('produk').delete().eq('id', produkId);
  revalidatePath('/toko-saya/produk');
}

export async function updateStatusPesanan(pesananId: string, statusBaru: string) {
  const supabase = await createClient();
  await supabase.from('pesanan').update({ status: statusBaru }).eq('id', pesananId);
  revalidatePath('/toko-saya/pesanan-masuk');
}