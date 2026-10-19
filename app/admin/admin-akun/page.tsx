import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { ambilAdmin } from '@/lib/auth/admin-guard';
import TambahAdminForm from './tambah-admin-form';
import TombolCabut from './tombol-cabut';

export const dynamic = 'force-dynamic';

type Admin = { id: string; full_name: string | null; phone: string | null };

export default async function AkunAdminPage() {
  const saya = await ambilAdmin();
  if (!saya) redirect('/beranda');

  const db = createAdminClient();
  const { data: peran } = await db.from('user_roles').select('user_id').eq('role', 'admin');
  const ids = (peran ?? []).map((r: { user_id: string }) => r.user_id);

  let daftar: Admin[] = [];
  if (ids.length > 0) {
    const { data } = await db.from('profiles').select('id, full_name, phone').in('id', ids).order('full_name');
    daftar = (data ?? []) as Admin[];
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Akun Admin</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Admin baru login memakai nomor HP yang didaftarkan di sini, lewat halaman login biasa.
        </p>
      </div>

      <TambahAdminForm />

      <div className="max-w-2xl">
        <h2 className="mb-2 font-medium text-secondary-700">Admin saat ini ({daftar.length})</h2>
        <ul className="text-sm">
          {daftar.map((a) => (
            <li key={a.id} className="flex items-center justify-between border-b border-neutral-100 py-2">
              <div>
                <div className="text-neutral-900">
                  {a.full_name || 'Tanpa nama'}
                  {a.id === saya.id && <span className="ml-2 text-xs text-neutral-400">(Anda)</span>}
                </div>
                <div className="text-xs text-neutral-500">{a.phone || '-'}</div>
              </div>
              {a.id !== saya.id && <TombolCabut userId={a.id} nama={a.full_name || a.phone || 'admin ini'} />}
            </li>
          ))}
          {daftar.length === 0 && <li className="py-2 text-neutral-400">Belum ada</li>}
        </ul>
      </div>
    </div>
  );
}