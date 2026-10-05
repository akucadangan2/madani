'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function beriRating(taskId: string, formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const base = `/kerja/${taskId}`;
  const rating = Number(formData.get('rating'));
  const komentar = String(formData.get('komentar') ?? '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`${base}?error=${encodeURIComponent('Pilih rating 1 sampai 5.')}`);
  }
  if (komentar.length > 500) {
    redirect(`${base}?error=${encodeURIComponent('Komentar maksimal 500 karakter.')}`);
  }

  const { error } = await supabase.rpc('rpc_beri_rating', {
    p_task_id: taskId,
    p_rating: rating,
    p_komentar: komentar || null,
  });
  if (error) redirect(`${base}?error=${encodeURIComponent(error.message)}`);

  redirect(`${base}?ok=${encodeURIComponent('Terima kasih, penilaianmu sudah tersimpan.')}`);
}