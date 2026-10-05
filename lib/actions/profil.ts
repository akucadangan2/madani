'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function tambahSkill(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) return;

  const skillBaru = (formData.get('skill') as string)?.trim();
  if (!skillBaru) return;

  const supabase = await createClient();
  const { data: profil } = await supabase.from('profiles').select('skills').eq('id', current.id).single();
  const skillSekarang: string[] = profil?.skills ?? [];

  if (skillSekarang.includes(skillBaru)) return;

  await supabase.from('profiles').update({ skills: [...skillSekarang, skillBaru] }).eq('id', current.id);
  revalidatePath('/profil/skill');
}

export async function hapusSkill(skillDihapus: string) {
  const current = await getCurrentUser();
  if (!current) return;

  const supabase = await createClient();
  const { data: profil } = await supabase.from('profiles').select('skills').eq('id', current.id).single();
  const skillSekarang: string[] = profil?.skills ?? [];

  await supabase.from('profiles').update({
    skills: skillSekarang.filter((s) => s !== skillDihapus),
  }).eq('id', current.id);

  revalidatePath('/profil/skill');
}

export async function updateProfil(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) return;

  const fullName = (formData.get('full_name') as string)?.trim();
  const noHp = (formData.get('no_hp') as string)?.trim();
  if (!fullName) return;

  const supabase = await createClient();
  await supabase.from('profiles').update({ full_name: fullName, no_hp: noHp }).eq('id', current.id);

  revalidatePath('/profil');
}

export async function pilihPeran(peranBaru: string) {
  const current = await getCurrentUser();
  if (!current) return;

  const supabase = await createClient();
  await supabase.from('profiles').update({ peran_aktif: peranBaru }).eq('id', current.id);

  redirect('/');
}

export async function ajukanVerifikasiKtp(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) return;

  const nik = (formData.get('nik') as string)?.trim();
  const fotoKtp = formData.get('foto_ktp') as File;
  if (!nik || !fotoKtp || fotoKtp.size === 0) return;

  const supabase = await createClient();

  const namaFile = `${current.id}-${Date.now()}.${fotoKtp.name.split('.').pop()}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('ktp')
    .upload(namaFile, fotoKtp);

  if (uploadError) return;

  const { data: publicUrl } = supabase.storage.from('ktp').getPublicUrl(uploadData.path);

  await supabase.from('verifikasi_ktp').upsert({
    user_id: current.id,
    nik,
    foto_ktp_url: publicUrl.publicUrl,
    status: 'menunggu',
  }, { onConflict: 'user_id' });

  revalidatePath('/profil/verifikasi-ktp');
}