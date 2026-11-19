'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { ambilAdmin } from '@/lib/auth/admin-guard';

function ke(path: string, kv: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(kv).toString()}`);
}

export async function blokirPengguna(fd: FormData): Promise<void> {
  const id = String(fd.get('id') ?? '').trim();
  const alasan = String(fd.get('alasan') ?? '').trim().slice(0, 300);
  const hal = `/admin/pekerja/${id}`;

  const pemanggil = await ambilAdmin();
  if (!pemanggil) ke('/admin/pekerja', { error: 'Hanya admin yang boleh memblokir' });
  if (!id) ke('/admin/pekerja', { error: 'Pengguna tidak valid' });
  if (pemanggil.id === id) ke(hal, { error: 'Tidak bisa memblokir akun sendiri' });
  if (alasan.length < 3) ke(hal, { error: 'Isi alasan pemblokiran (minimal 3 huruf)' });

  const db = createAdminClient();
  const { data: admin } = await db.from('user_roles').select('user_id').eq('user_id', id).eq('role', 'admin').maybeSingle();
  if (admin) ke(hal, { error: 'Akun ini admin. Cabut akses admin dulu di menu Akun Admin.' });

  // 876000 jam = sekitar 100 tahun; pengguna tidak bisa login atau memperbarui sesi
  const { error } = await db.auth.admin.updateUserById(id, { ban_duration: '876000h' });
  if (error) ke(hal, { error: 'Gagal memblokir akun: ' + error.message });

  const { error: e2 } = await db.from('pengguna_blokir').upsert({ user_id: id, alasan, oleh: pemanggil.id });
  if (e2) ke(hal, { error: 'Akun terblokir, tetapi alasan gagal dicatat: ' + e2.message });

  revalidatePath('/admin/pekerja');
  ke(hal, { ok: 'Akun diblokir. Pengguna tidak bisa login lagi.' });
}

export async function bukaBlokirPengguna(fd: FormData): Promise<void> {
  const id = String(fd.get('id') ?? '').trim();
  const hal = `/admin/pekerja/${id}`;
  if (!(await ambilAdmin())) ke('/admin/pekerja', { error: 'Hanya admin' });
  if (!id) ke('/admin/pekerja', { error: 'Pengguna tidak valid' });

  const db = createAdminClient();
  const { error } = await db.auth.admin.updateUserById(id, { ban_duration: 'none' });
  if (error) ke(hal, { error: 'Gagal membuka blokir: ' + error.message });
  await db.from('pengguna_blokir').delete().eq('user_id', id);

  revalidatePath('/admin/pekerja');
  ke(hal, { ok: 'Blokir dibuka. Pengguna bisa login lagi.' });
}