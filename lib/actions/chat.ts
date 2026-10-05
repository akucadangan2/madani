'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function kirimPesan(percakapanId: string, formData: FormData): Promise<{ error?: string }> {
  const isi = String(formData.get('isi') ?? '').trim();
  if (!isi) return { error: 'Pesan kosong.' };
  if (isi.length > 2000) return { error: 'Pesan maksimal 2000 karakter.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('rpc_kirim_pesan', {
    p_percakapan_id: percakapanId,
    p_isi: isi,
  });
  if (error) return { error: error.message };
  return {};
}

// Dipakai tombol "Chat": buka/mulai percakapan lalu masuk ke ruangnya
export async function mulaiChat(lawanId: string, label: string, href: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase.rpc('rpc_mulai_chat', {
    p_lawan: lawanId,
    p_label: label,
    p_href: href,
  });
  if (error || !data) {
    redirect('/chat?error=' + encodeURIComponent(error?.message ?? 'Gagal memulai chat'));
  }
  redirect('/chat/' + String(data));
}

// Dipertahankan supaya import lama tidak rusak
export async function mulaiPercakapan(lawanBicaraId: string): Promise<string | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('rpc_mulai_chat', {
    p_lawan: lawanBicaraId,
    p_label: null,
    p_href: null,
  });
  return data ? String(data) : undefined;
}