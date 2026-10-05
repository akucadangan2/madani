'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const postingSchema = z.object({
  judul: z.string().min(5, 'Judul minimal 5 karakter').max(100, 'Judul maksimal 100 karakter'),
  deskripsi: z.string().min(20, 'Deskripsi minimal 20 karakter').max(2000, 'Deskripsi maksimal 2000 karakter'),
  kategoriId: z.string().min(1, 'Pilih kategori pekerjaan'),
  kecamatanId: z.string().min(1, 'Pilih kecamatan'),
  upah: z.coerce.number({ invalid_type_error: 'Upah harus berupa angka' }).positive('Upah harus lebih dari 0'),
});

export type PostingKerjaResult =
  | { success: true; taskId: string }
  | { success: false; error: string };

export async function postingKerja(formData: FormData): Promise<PostingKerjaResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Kamu harus login dulu untuk posting kerja.' };

  const parsed = postingSchema.safeParse({
    judul: formData.get('judul'),
    deskripsi: formData.get('deskripsi'),
    kategoriId: formData.get('kategoriId'),
    kecamatanId: formData.get('kecamatanId'),
    upah: formData.get('upah'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data belum lengkap/valid.' };
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      judul: parsed.data.judul,
      deskripsi: parsed.data.deskripsi,
      kategori_id: parsed.data.kategoriId,
      kecamatan_id: parsed.data.kecamatanId,
      upah: parsed.data.upah,
      status: 'terbuka',
      pemberi_kerja_id: user.id,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/kerja');
  return { success: true, taskId: task.id as string };
}

function kembali(taskId: string, kv: Record<string, string>): never {
  redirect(`/kerja/${taskId}?${new URLSearchParams(kv).toString()}`);
}

export async function lamarKerja(taskId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase.from('lamaran_kerja').insert({
    task_id: taskId,
    pencari_kerja_id: user.id,
    status: 'menunggu',
  });
  if (error) {
    kembali(taskId, {
      error: error.code === '42501' ? 'Kamu tidak bisa melamar pekerjaan ini' : error.message,
    });
  }

  revalidatePath(`/kerja/${taskId}`);
  kembali(taskId, { ok: 'Lamaran terkirim. Tunggu konfirmasi pemberi kerja' });
}

export async function terimaLamaran(lamaranId: string, taskId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('rpc_terima_lamaran', { p_lamaran_id: lamaranId });
  if (error) kembali(taskId, { error: error.message });

  revalidatePath(`/kerja/${taskId}`);
  kembali(taskId, { ok: 'Pekerja dipilih. Lanjutkan dengan membayar dan menahan dana' });
}

export async function bayarTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('rpc_bayar_task', { p_task_id: taskId });
  if (error) kembali(taskId, { error: error.message });

  revalidatePath(`/kerja/${taskId}`);
  kembali(taskId, { ok: 'Dana ditahan. Pekerja bisa mulai bekerja' });
}

export async function selesaikanTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('rpc_selesaikan_task', { p_task_id: taskId });
  if (error) kembali(taskId, { error: error.message });

  revalidatePath('/', 'layout');
  kembali(taskId, { ok: 'Pekerjaan selesai. Dana sudah dicairkan ke saldo pekerja' });
}