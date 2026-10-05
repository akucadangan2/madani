import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const roleLabel: Record<string, string> = {
  pencari_kerja: 'Pencari Kerja',
  pemberi_kerja: 'Pemberi Kerja',
  penjual: 'Penjual',
  pembeli: 'Pembeli',
  admin: 'Admin',
  kecamatan: 'Kecamatan',
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const base = supabase.from('profiles').select('*').order('full_name').limit(100);
  const [{ data: profileList, error: profileError }, { data: roleList, error: roleError }] =
    await Promise.all([
      q ? base.ilike('full_name', `%${q}%`) : base,
      supabase.from('user_roles').select('*'),
    ]);

  const rolesByUser = new Map<string, string[]>();
  (roleList ?? []).forEach((r: any) => {
    const arr = rolesByUser.get(r.user_id) ?? [];
    arr.push(r.role);
    rolesByUser.set(r.user_id, arr);
  });

  const errorMsg = profileError?.message ?? roleError?.message;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Manajemen User</h1>
          <p className="text-sm text-neutral-500">
            {profileList?.length ?? 0} user{q ? ` untuk "${q}"` : ''}
          </p>
        </div>

        <form method="get" className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Cari nama user..."
            className="w-56 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white">Cari</button>
        </form>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">ID</th>
            </tr>
          </thead>
          <tbody>
            {profileList?.map((p: any) => {
              const roles = rolesByUser.get(p.id) ?? [];
              return (
                <tr key={p.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {p.full_name ?? '(tanpa nama)'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
                          >
                            {roleLabel[role] ?? role}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-neutral-400">Belum ada role</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                    {String(p.id).slice(0, 8)}
                  </td>
                </tr>
              );
            })}
            {(!profileList || profileList.length === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-neutral-400">
                  Belum ada user
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}