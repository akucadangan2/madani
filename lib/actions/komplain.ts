'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function ajukanKomplain(pesananId: string, formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const alasan = String(formData.get('alasan') ?? '').trim();
  if (alasan.length < 10) {
    redirect('/marketplace/pesanan?error=' + encodeURIComponent('Jelaskan masalahnya minimal 10 karakter.'));
  }

  const { error } = await supabase.rpc('rpc_ajukan_komplain', {
    p_pesanan_id: pesananId,
    p_alasan: alasan,
  });
  if (error) redirect('/marketplace/pesanan?error=' + encodeURIComponent(error.message));

  redirect(
    '/marketplace/pesanan?ok=' + encodeURIComponent('Komplain terkirim. Dana tetap ditahan sampai admin memutuskan.')
  );
}