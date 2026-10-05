'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { redirect } from 'next/navigation';

export async function ajukanPencairan(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) return;

  const jumlah = Number(formData.get('jumlah'));
  const bankNama = (formData.get('bank_nama') as string)?.trim();
  const bankRekening = (formData.get('bank_rekening') as string)?.trim();
  if (!jumlah || !bankNama || !bankRekening) return;

  const supabase = await createClient();

  const { data: profil } = await supabase.from('profiles').select('saldo').eq('id', current.id).single();
  if (!profil || jumlah > Number(profil.saldo)) return;

  await supabase.from('pencairan_dana').insert({
    user_id: current.id,
    jumlah,
    bank_nama: bankNama,
    bank_rekening: bankRekening,
    status: 'menunggu',
  });

  // Tahan saldo-nya dulu (dikurangin di awal, dikembaliin kalau ditolak admin)
  await supabase.from('profiles').update({ saldo: Number(profil.saldo) - jumlah }).eq('id', current.id);
  await supabase.from('saldo_transaksi').insert({
    user_id: current.id,
    tipe: 'keluar',
    jumlah,
    keterangan: 'Pengajuan tarik dana',
  });

  redirect('/saldo');
}