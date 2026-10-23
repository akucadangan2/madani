'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { COOKIE_TOKO_AKTIF } from '@/lib/toko-aktif';

async function sesi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function pilihTokoAktif(tokoId: string): Promise<void> {
  const { supabase, user } = await sesi();
  const { data } = await supabase
    .from('toko')
    .select('id')
    .eq('id', tokoId)
    .eq('penjual_id', user.id)
    .maybeSingle();
  if (data) {
    (await cookies()).set(COOKIE_TOKO_AKTIF, tokoId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: true,
    });
  }
  revalidatePath('/toko-saya');
  redirect('/toko-saya');
}

export async function hapusTokoSaya(tokoId: string): Promise<void> {
  const { supabase } = await sesi();
  const { error } = await supabase.rpc('rpc_hapus_toko', { p_toko: tokoId });
  if (error) {
    redirect('/toko-saya?error=' + encodeURIComponent(error.message));
  }
  const jar = await cookies();
  if (jar.get(COOKIE_TOKO_AKTIF)?.value === tokoId) jar.delete(COOKIE_TOKO_AKTIF);
  revalidatePath('/toko-saya');
  redirect('/toko-saya?ok=' + encodeURIComponent('Toko dihapus.'));
}