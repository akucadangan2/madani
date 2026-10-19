'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { ambilAdmin } from '@/lib/auth/admin-guard';

export type HasilAdmin = { ok: boolean; pesan: string };

function normalisasiHp(input: string): string | null {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  if (!/^628\d{7,12}$/.test(d)) return null;
  return d;
}

export async function tambahAdmin(_prev: HasilAdmin | null, formData: FormData): Promise<HasilAdmin> {
  const pemanggil = await ambilAdmin();
  if (!pemanggil) return { ok: false, pesan: 'Hanya admin yang boleh menambah admin' };

  const nama = String(formData.get('nama') ?? '').trim();
  const hp = normalisasiHp(String(formData.get('hp') ?? ''));
  if (nama.length < 3) return { ok: false, pesan: 'Nama minimal 3 huruf' };
  if (!hp) return { ok: false, pesan: 'Nomor HP tidak valid. Contoh: 08123456789' };

  const db = createAdminClient();

  let userId: string;
  const { data: profil } = await db
    .from('profiles')
    .select('id, full_name')
    .in('phone', [hp, '+' + hp])
    .limit(1)
    .maybeSingle();

  if (profil) {
    userId = profil.id as string;
    if (!profil.full_name) {
      await db.from('profiles').update({ full_name: nama }).eq('id', userId);
    }
  } else {
    const { data, error } = await db.auth.admin.createUser({
      phone: hp,
      phone_confirm: true,
      user_metadata: { full_name: nama },
    });
    if (error || !data.user) {
      return { ok: false, pesan: 'Gagal membuat akun: ' + (error?.message ?? 'tidak diketahui') };
    }
    userId = data.user.id;
  }

  const { data: sudah } = await db
    .from('user_roles')
    .select('user_id')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  if (sudah) return { ok: false, pesan: 'Nomor ini sudah menjadi admin' };

  const { error: errPeran } = await db.from('user_roles').insert({ user_id: userId, role: 'admin' });
  if (errPeran) return { ok: false, pesan: 'Gagal menambah peran admin: ' + errPeran.message };

  revalidatePath('/admin/admin-akun');
  return { ok: true, pesan: `${nama} sekarang admin. Login memakai nomor ${hp}.` };
}

export async function cabutAdmin(userId: string): Promise<HasilAdmin> {
  const pemanggil = await ambilAdmin();
  if (!pemanggil) return { ok: false, pesan: 'Hanya admin yang boleh mencabut admin' };
  if (pemanggil.id === userId) return { ok: false, pesan: 'Tidak bisa mencabut akses admin diri sendiri' };

  const db = createAdminClient();
  const { count } = await db
    .from('user_roles')
    .select('user_id', { count: 'exact', head: true })
    .eq('role', 'admin');
  if ((count ?? 0) <= 1) return { ok: false, pesan: 'Admin terakhir tidak bisa dicabut' };

  const { error } = await db.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
  if (error) return { ok: false, pesan: 'Gagal mencabut: ' + error.message };

  revalidatePath('/admin/admin-akun');
  return { ok: true, pesan: 'Akses admin dicabut' };
}