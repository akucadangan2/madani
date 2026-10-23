'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function kirimUlasanToko(tokoId: string, formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const hal = `/marketplace/toko/${tokoId}`;
  const rating = Math.round(Number(formData.get('rating')));
  const komentar = String(formData.get('komentar') ?? '').trim().slice(0, 500);

  if (!(rating >= 1 && rating <= 5)) {
    redirect(`${hal}?error=${encodeURIComponent('Pilih bintang 1 sampai 5')}`);
  }

  const { error } = await supabase.rpc('app_tulis_ulasan_toko', {
    p_toko_id: tokoId,
    p_rating: rating,
    p_komentar: komentar || null,
  });
  if (error) {
    redirect(`${hal}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(hal);
  redirect(`${hal}?ok=${encodeURIComponent('Ulasan toko tersimpan, terima kasih!')}`);
}