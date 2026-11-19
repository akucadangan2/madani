'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** Bayar biaya kontak (bila aktif dan belum dibayar) lalu masuk ke chat dengan pekerja. */
export async function hubungiPekerja(pekerjaId: string, nama: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase.rpc('rpc_mulai_chat_pekerja', {
    p_pekerja: pekerjaId,
    p_label: 'Pekerja: ' + nama,
  });
  if (error || !data) {
    const pesan = error?.message ?? 'Gagal memulai chat';
    if (pesan.toLowerCase().includes('saldo')) redirect('/saldo?error=' + encodeURIComponent(pesan));
    redirect('/cari-pekerja?error=' + encodeURIComponent(pesan));
  }
  redirect('/chat/' + String(data));
}