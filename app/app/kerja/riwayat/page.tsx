import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Briefcase, ChevronRight, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { rupiah, waktuRelatif } from '@/lib/admin/data';

export const dynamic = 'force-dynamic';

type Task = {
  id: string;
  judul: string;
  status: string;
  upah: number | string;
  satuan_upah: string | null;
  created_at: string;
};
type LamaranSaya = { id: string; status: string; created_at: string; tasks: Task | Task[] | null };

const STATUS_CLS: Record<string, string> = {
  terbuka: 'bg-green-50 text-green-700',
  proses: 'bg-amber-50 text-amber-700',
  selesai: 'bg-neutral-100 text-neutral-600',
  dibatalkan: 'bg-red-50 text-red-700',
  menunggu: 'bg-amber-50 text-amber-700',
  diterima: 'bg-green-50 text-green-700',
  ditolak: 'bg-red-50 text-red-700',
};

function Lencana({ s }: { s: string }) {
  return (
    <span className={'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ' + (STATUS_CLS[s] ?? 'bg-neutral-100 text-neutral-600')}>
      {s}
    </span>
  );
}

export default async function RiwayatKerjaPage() {
  const current = await getCurrentUser();
  if (!current) redirect('/login');

  const supabase = await createClient();
  const [{ data: postingData }, { data: lamaranData }] = await Promise.all([
    supabase.from('tasks').select('*').eq('pemberi_kerja_id', current.id).order('created_at', { ascending: false }),
    supabase
      .from('lamaran_kerja')
      .select('id, status, created_at, tasks(id, judul, status, upah, satuan_upah, created_at)')
      .eq('pencari_kerja_id', current.id)
      .order('created_at', { ascending: false }),
  ]);

  const posting = (postingData ?? []) as Task[];
  const lamaranSaya = (lamaranData ?? []) as unknown as LamaranSaya[];

  // Jumlah pelamar per lowongan (RLS: pemilik melihat semua pelamar lowongannya)
  const ids = posting.map((t) => t.id);
  const { data: pelamarData } = ids.length
    ? await supabase.from('lamaran_kerja').select('task_id, status').in('task_id', ids)
    : { data: [] as { task_id: string; status: string }[] };
  const total = new Map<string, number>();
  const menunggu = new Map<string, number>();
  for (const l of (pelamarData ?? []) as { task_id: string; status: string }[]) {
    total.set(l.task_id, (total.get(l.task_id) ?? 0) + 1);
    if (l.status === 'menunggu') menunggu.set(l.task_id, (menunggu.get(l.task_id) ?? 0) + 1);
  }

  const perluTanggap = posting.filter((t) => t.status === 'terbuka' && (menunggu.get(t.id) ?? 0) > 0);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-6">
      <h1 className="font-display text-2xl font-bold text-neutral-900">Riwayat Kerja</h1>

      {perluTanggap.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-700">Perlu ditanggapi</h2>
          <div className="space-y-2">
            {perluTanggap.map((t) => (
              <Link
                key={t.id}
                href={'/kerja/' + t.id}
                className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Users className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-neutral-900">{t.judul}</span>
                  <span className="block text-sm text-amber-800">{menunggu.get(t.id)} pelamar menunggu keputusanmu</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-amber-400" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold text-neutral-800">Lowongan yang saya posting</h2>
        {posting.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 p-5 text-sm text-neutral-500">
            Belum ada lowongan.{' '}
            <Link href="/kerja/posting" className="font-semibold text-primary-600 hover:underline">
              Pasang lowongan
            </Link>
          </p>
        ) : (
          <div className="space-y-2">
            {posting.map((t) => (
              <Link
                key={t.id}
                href={'/kerja/' + t.id}
                className="block rounded-2xl border border-neutral-200 bg-white p-4 hover:border-primary-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-neutral-900">{t.judul}</span>
                  <Lencana s={t.status} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                  <span className="font-medium text-secondary-700">
                    {rupiah(t.upah)}
                    {t.satuan_upah ? ' per ' + t.satuan_upah : ''}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {total.get(t.id) ?? 0} pelamar
                    {(menunggu.get(t.id) ?? 0) > 0 && t.status === 'terbuka' ? ' (' + menunggu.get(t.id) + ' menunggu)' : ''}
                  </span>
                  <span>{waktuRelatif(t.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-neutral-800">Lamaran saya</h2>
        {lamaranSaya.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 p-5 text-sm text-neutral-500">
            Belum ada lamaran.{' '}
            <Link href="/kerja" className="font-semibold text-primary-600 hover:underline">
              Cari lowongan
            </Link>
          </p>
        ) : (
          <div className="space-y-2">
            {lamaranSaya.map((l) => {
              const t = Array.isArray(l.tasks) ? l.tasks[0] : l.tasks;
              if (!t) return null;
              return (
                <Link
                  key={l.id}
                  href={'/kerja/' + t.id}
                  className="block rounded-2xl border border-neutral-200 bg-white p-4 hover:border-primary-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2 font-semibold text-neutral-900">
                      <Briefcase className="h-4 w-4 shrink-0 text-neutral-400" />
                      {t.judul}
                    </span>
                    <Lencana s={l.status} />
                  </div>
                  <div className="mt-1.5 text-sm text-neutral-500">
                    {rupiah(t.upah)}
                    {t.satuan_upah ? ' per ' + t.satuan_upah : ''} - melamar {waktuRelatif(l.created_at)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
