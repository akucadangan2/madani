'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const SATUAN = ['jam', 'hari', 'minggu', 'bulan', 'pertemuan', 'paket'];
const HAL = '/profil/tarif-dokumen';

async function sesi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function simpanTarif(formData: FormData): Promise<void> {
  const { supabase, user } = await sesi();
  const mentah = String(formData.get('tarif') ?? '').replace(/\D/g, '');
  const tarif = mentah === '' ? 0 : Number(mentah);
  const satuan = String(formData.get('satuan_tarif') ?? 'hari');

  if (!Number.isInteger(tarif) || tarif < 0 || tarif > 100000000) {
    redirect(`${HAL}?error=${encodeURIComponent('Tarif tidak valid.')}`);
  }
  if (!SATUAN.includes(satuan)) {
    redirect(`${HAL}?error=${encodeURIComponent('Satuan tarif tidak valid.')}`);
  }

  const { error } = await supabase
    .from('profiles')
    .update({ tarif: tarif > 0 ? tarif : null, satuan_tarif: tarif > 0 ? satuan : null })
    .eq('id', user.id);
  if (error) redirect(`${HAL}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(HAL);
  redirect(`${HAL}?ok=${encodeURIComponent('Tarif disimpan.')}`);
}

export async function ubahPublikDokumen(id: string, publik: boolean): Promise<void> {
  const { supabase, user } = await sesi();
  await supabase.from('dokumen_pekerja').update({ tampil_publik: publik }).eq('id', id).eq('user_id', user.id);
  revalidatePath(HAL);
  redirect(HAL);
}

export async function hapusDokumen(id: string): Promise<void> {
  const { supabase, user } = await sesi();
  const { data } = await supabase
    .from('dokumen_pekerja')
    .select('path')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (data) {
    await supabase.from('dokumen_pekerja').delete().eq('id', id).eq('user_id', user.id);
    await supabase.storage.from('dokumen-pekerja').remove([data.path as string]);
  }
  revalidatePath(HAL);
  redirect(`${HAL}?ok=${encodeURIComponent('Dokumen dihapus.')}`);
}