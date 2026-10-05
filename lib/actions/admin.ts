'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function setujuiKtp(verifikasiId: string) {
  const supabase = await createClient();
  await supabase.from('verifikasi_ktp').update({ status: 'terverifikasi' }).eq('id', verifikasiId);
  revalidatePath('/verifikasi-ktp');
}

export async function tolakKtp(verifikasiId: string) {
  const supabase = await createClient();
  await supabase.from('verifikasi_ktp').update({ status: 'ditolak' }).eq('id', verifikasiId);
  revalidatePath('/verifikasi-ktp');
}

export async function tambahKategori(formData: FormData) {
  const nama = (formData.get('nama') as string)?.trim();
  const tipe = formData.get('tipe') as string;
  if (!nama || !tipe) return;

  const supabase = await createClient();
  await supabase.from('kategori').insert({ nama, tipe });
  revalidatePath('/kategori');
}

export async function hapusKategori(kategoriId: string) {
  const supabase = await createClient();
  await supabase.from('kategori').delete().eq('id', kategoriId);
  revalidatePath('/kategori');
}

export async function tambahKecamatan(formData: FormData) {
  const nama = (formData.get('nama') as string)?.trim();
  if (!nama) return;

  const supabase = await createClient();
  await supabase.from('kecamatan').insert({ nama });
  revalidatePath('/wilayah');
}

export async function hapusKecamatan(kecamatanId: string) {
  const supabase = await createClient();
  await supabase.from('kecamatan').delete().eq('id', kecamatanId);
  revalidatePath('/wilayah');
}

export async function setujuiPencairan(pencairanId: string) {
  const supabase = await createClient();
  await supabase.from('pencairan_dana').update({ status: 'selesai' }).eq('id', pencairanId);
  revalidatePath('/pencairan-dana');
}

export async function tolakPencairan(pencairanId: string, userId: string, jumlah: number) {
  const supabase = await createClient();

  await supabase.from('pencairan_dana').update({ status: 'ditolak' }).eq('id', pencairanId);

  // Kembaliin saldo yang sempat ditahan
  const { data: profil } = await supabase.from('profiles').select('saldo').eq('id', userId).single();
  await supabase.from('profiles').update({ saldo: Number(profil?.saldo ?? 0) + jumlah }).eq('id', userId);
  await supabase.from('saldo_transaksi').insert({
    user_id: userId,
    tipe: 'masuk',
    jumlah,
    keterangan: 'Pengembalian saldo (pencairan ditolak)',
  });

  revalidatePath('/pencairan-dana');
}

export async function updateBagiHasil(formData: FormData) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('pengaturan_bagi_hasil').select('id').maybeSingle();

  const payload = {
    persen_platform: Number(formData.get('persen_platform')),
    persen_kecamatan: Number(formData.get('persen_kecamatan')),
    persen_mitra: Number(formData.get('persen_mitra')),
  };

  if (existing) {
    await supabase.from('pengaturan_bagi_hasil').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('pengaturan_bagi_hasil').insert(payload);
  }

  revalidatePath('/bagi-hasil');
}