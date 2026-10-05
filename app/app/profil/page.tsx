import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Check, ChevronRight, LogOut, ShieldCheck, Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

const LABEL_PERAN: Record<string, string> = {
  pemberi_kerja: 'Pemberi Kerja',
  pencari_kerja: 'Pencari Kerja',
  penjual: 'Penjual',
  pembeli: 'Pembeli',
  admin: 'Admin',
};

function labelPeran(r: string) {
  return LABEL_PERAN[r] ?? r;
}

async function simpanNama(formData: FormData): Promise<void> {
  'use server';
  const nama = String(formData.get('nama') ?? '').trim().slice(0, 80);
  if (!nama) redirect('/profil?error=' + encodeURIComponent('Nama tidak boleh kosong'));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase.from('profiles').update({ full_name: nama }).eq('id', user.id);
  if (error) redirect('/profil?error=' + encodeURIComponent(error.message));

  revalidatePath('/', 'layout');
  redirect('/profil?ok=' + encodeURIComponent('Nama berhasil disimpan'));
}

async function gantiPeran(formData: FormData): Promise<void> {
  'use server';
  const peran = String(formData.get('peran') ?? '');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  const punya = ((roles ?? []) as { role: string }[]).some((r) => r.role === peran);
  if (!punya) redirect('/profil?error=' + encodeURIComponent('Peran tidak valid'));

  const { error } = await supabase.from('profiles').update({ active_role: peran }).eq('id', user.id);
  if (error) redirect('/profil?error=' + encodeURIComponent(error.message));

  revalidatePath('/', 'layout');
  redirect('/beranda');
}

async function keluar(): Promise<void> {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error: errMsg } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: rolesData }, { data: ktpData }] = await Promise.all([
    supabase.from('profiles').select('full_name, active_role').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', user.id),
    supabase
      .from('verifikasi_ktp')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const p = profile as { full_name?: string | null; active_role?: string | null } | null;
  const roles = ((rolesData ?? []) as { role: string }[]).map((r) => r.role);
  const ktp = ktpData as { status?: string } | null;
  const isAdmin = roles.includes('admin');
  const nama = p?.full_name ?? '';
  const aktif = p?.active_role ?? '';
  const inisial = nama.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="mx-auto max-w-xl">
      {/* Header */}
      <div className="bg-ink-900 px-5 pb-10 pt-10 text-white">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 font-display text-2xl font-bold">
            {inisial}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold">{nama || 'Belum ada nama'}</h1>
            <p className="text-sm text-white/60">{user.phone ? `+${user.phone.replace(/^\+/, '')}` : user.email}</p>
          </div>
        </div>
      </div>

      <div className="-mt-5 space-y-4 px-4">
        {ok && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
            {ok}
          </div>
        )}
        {errMsg && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {errMsg}
          </div>
        )}

        {/* Ubah nama */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-neutral-900">Nama</h2>
          <form action={simpanNama} className="mt-3 flex gap-2">
            <input
              name="nama"
              defaultValue={nama}
              maxLength={80}
              placeholder="Nama lengkap"
              className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
            <button className="rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              Simpan
            </button>
          </form>
        </section>

        {/* Peran */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-neutral-900">Peran aktif</h2>
          <p className="mt-0.5 text-sm text-neutral-500">Pilih peran yang ingin dipakai sekarang.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {roles.length === 0 && (
              <Link href="/pilih-peran" className="text-sm font-medium text-secondary-700 underline">
                Pilih peran dulu
              </Link>
            )}
            {roles.map((r) => (
              <form key={r} action={gantiPeran}>
                <input type="hidden" name="peran" value={r} />
                <button
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ${
                    r === aktif
                      ? 'bg-ink-900 text-white'
                      : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {r === aktif && <Check className="h-4 w-4" />}
                  {labelPeran(r)}
                </button>
              </form>
            ))}
          </div>
          {roles.length > 0 && (
            <Link href="/pilih-peran" className="mt-3 inline-block text-sm text-secondary-700 hover:underline">
              Tambah peran lain
            </Link>
          )}
        </section>

        {/* Menu */}
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <Link
            href="/saldo"
            className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3.5 hover:bg-neutral-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <Wallet className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1 text-sm font-medium text-neutral-900">Saldo</span>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          </Link>

          <Link
            href="/profil/verifikasi-ktp"
            className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3.5 hover:bg-neutral-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <ShieldCheck className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1 text-sm font-medium text-neutral-900">Verifikasi KTP</span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
              {ktp?.status ?? 'Belum diajukan'}
            </span>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          </Link>

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <ShieldCheck className="h-[18px] w-[18px]" />
              </span>
              <span className="flex-1 text-sm font-medium text-neutral-900">Panel Admin</span>
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            </Link>
          )}
        </section>

        {/* Keluar */}
        <form action={keluar}>
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3.5 text-sm font-semibold text-red-700 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </form>
      </div>
    </div>
  );
}