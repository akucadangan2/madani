'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createKategori(formData: FormData) {
  const nama = formData.get('nama') as string;
  const tipe = formData.get('tipe') as string;

  const supabase = await createClient();
  const { error } = await supabase.from('kategori').insert({ nama, tipe, urutan: 50 });
  if (error) return { error: error.message };

  revalidatePath('/admin/kategori');
  return { success: true };
}

export async function deleteKategori(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('kategori').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/kategori');
  return { success: true };
}

const HAL = '/admin/kategori';

function balik(jenis: 'ok' | 'error', pesan: string, buka?: string): never {
  const q = new URLSearchParams();
  q.set(jenis, pesan);
  if (buka) q.set('buka', buka);
  redirect(`${HAL}?${q.toString()}`);
}

export async function ubahKategori(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const nama = String(formData.get('nama') ?? '').trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc('rpc_admin_ubah_kategori', { p_id: id, p_nama: nama });
  if (error) balik('error', error.message);
  revalidatePath(HAL);
  balik('ok', 'Nama kategori disimpan.');
}

export async function hapusKategori(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const pindah = String(formData.get('pindah_ke') ?? '').trim();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('rpc_admin_hapus_kategori', {
    p_id: id,
    p_pindah_ke: pindah || null,
  });
  if (error) balik('error', error.message);
  const d = (data ?? {}) as { produk?: number; lowongan?: number; keahlian?: number };
  const dipindah = Number(d.produk ?? 0) + Number(d.lowongan ?? 0) + Number(d.keahlian ?? 0);
  revalidatePath(HAL);
  balik('ok', dipindah > 0 ? `Kategori dihapus, ${dipindah} data dipindahkan ke kategori tujuan.` : 'Kategori dihapus.');
}

export async function tambahSub(formData: FormData): Promise<void> {
  const kategori = String(formData.get('kategori_id') ?? '');
  const nama = String(formData.get('nama') ?? '').trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc('rpc_admin_tambah_sub', { p_kategori: kategori, p_nama: nama });
  if (error) balik('error', error.message, kategori);
  revalidatePath(HAL);
  balik('ok', 'Sub kategori ditambahkan.', kategori);
}

export async function ubahSub(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const kategori = String(formData.get('kategori_id') ?? '');
  const nama = String(formData.get('nama') ?? '').trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc('rpc_admin_ubah_sub', { p_id: id, p_nama: nama });
  if (error) balik('error', error.message, kategori);
  revalidatePath(HAL);
  balik('ok', 'Sub kategori disimpan.', kategori);
}

export async function hapusSub(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const kategori = String(formData.get('kategori_id') ?? '');
  const supabase = await createClient();
  const { error } = await supabase.rpc('rpc_admin_hapus_sub', { p_id: id });
  if (error) balik('error', error.message, kategori);
  revalidatePath(HAL);
  balik('ok', 'Sub kategori dihapus.', kategori);
}