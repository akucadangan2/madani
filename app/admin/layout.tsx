import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { KTP, PENARIKAN, TOKO } from '@/lib/admin/konstanta';
import { hitung } from '@/lib/admin/data';
import AdminShell from './_components/AdminShell';
import Toast from './_components/Toast';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === 'admin');
  if (!isAdmin) redirect('/beranda');

  const [{ data: profile }, tokoMenunggu, ktpMenunggu, penarikanMenunggu, komplainTerbuka] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    hitung(supabase, 'toko', 'status_verifikasi', TOKO.MENUNGGU),
    hitung(supabase, 'verifikasi_ktp', 'status', KTP.MENUNGGU),
    hitung(supabase, 'penarikan_dana', 'status', PENARIKAN.MENUNGGU),
    hitung(supabase, 'komplain', 'status', 'terbuka'),
  ]);

  const nama = (profile as { full_name?: string | null } | null)?.full_name ?? '';

  return (
    <AdminShell
      nama={nama}
      counts={{
        toko: tokoMenunggu,
        ktp: ktpMenunggu,
        penarikan: penarikanMenunggu,
        komplain: komplainTerbuka,
      }}
    >
      <Suspense fallback={null}>
        <Toast />
      </Suspense>
      {children}
    </AdminShell>
  );
}