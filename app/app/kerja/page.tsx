import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';
import {
  Search, SlidersHorizontal, MapPin, Briefcase, Plus, ArrowRight, Inbox, ChevronDown,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type SearchParams = {
  q?: string;
  kategori?: string;
  kecamatan?: string;
  sort?: string;
};

const SORT_OPTIONS = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'upah_tertinggi', label: 'Upah Tertinggi' },
  { value: 'upah_terendah', label: 'Upah Terendah' },
];

function formatRupiah(n: number) {
  return `Rp ${Number(n).toLocaleString('id-ID')}`;
}

function formatRelativeTime(dateStr?: string | null) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek} minggu lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildHref(current: SearchParams, overrides: Partial<SearchParams>) {
  const merged = { ...current, ...overrides };
  const params = new URLSearchParams();
  if (merged.q) params.set('q', merged.q);
  if (merged.kategori) params.set('kategori', merged.kategori);
  if (merged.kecamatan) params.set('kecamatan', merged.kecamatan);
  if (merged.sort) params.set('sort', merged.sort);
  const qs = params.toString();
  return qs ? `/kerja?${qs}` : '/kerja';
}

export default async function KerjaListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: kategoriList }, { data: kecamatanList }] = await Promise.all([
    supabase.from('kategori').select('id, nama').order('nama'),
    supabase.from('kecamatan').select('id, nama').order('nama'),
  ]);

  let query = supabase
    .from('tasks')
    .select('*, kategori(id, nama), kecamatan(id, nama)')
    .eq('status', 'terbuka');

  if (sp.q) query = query.ilike('judul', `%${sp.q}%`);
  if (sp.kategori) query = query.eq('kategori_id', sp.kategori);
  if (sp.kecamatan) query = query.eq('kecamatan_id', sp.kecamatan);

  if (sp.sort === 'upah_tertinggi') query = query.order('upah', { ascending: false });
  else if (sp.sort === 'upah_terendah') query = query.order('upah', { ascending: true });
  else query = query.order('created_at', { ascending: false });

  const { data: tasks } = await query.limit(60);

  const hasFilter = Boolean(sp.q || sp.kategori || sp.kecamatan);

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">Lowongan Kerja</h1>
              <p className="text-sm text-neutral-500">
                {tasks?.length ?? 0} lowongan terbuka di kecamatanmu
              </p>
            </div>
            <Link
              href="/kerja/posting"
              className="hidden items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary-500/30 hover:bg-primary-600 sm:inline-flex"
            >
              <Plus className="h-4 w-4" /> Posting Kerja
            </Link>
          </div>

          {/* Search + sort */}
          <form method="GET" className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <input type="hidden" name="kategori" value={sp.kategori ?? ''} />
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                name="q"
                defaultValue={sp.q}
                placeholder="Cari posisi kerja..."
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div className="flex gap-2.5">
              <div className="relative flex-1 sm:w-44 sm:flex-none">
                <select
                  name="kecamatan"
                  defaultValue={sp.kecamatan ?? ''}
                  className="w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-3 pr-9 text-sm text-neutral-700 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">Semua Kecamatan</option>
                  {kecamatanList?.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </div>
              <div className="relative flex-1 sm:w-44 sm:flex-none">
                <select
                  name="sort"
                  defaultValue={sp.sort ?? 'terbaru'}
                  className="w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-3 pr-9 text-sm text-neutral-700 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-700"
              >
                Cari
              </button>
            </div>
          </form>

          {/* Kategori chips */}
          {kategoriList && kategoriList.length > 0 && (
            <div className="mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
              <Link
                href={buildHref(sp, { kategori: undefined })}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                  !sp.kategori
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-300'
                )}
              >
                Semua
              </Link>
              {kategoriList.map((k) => (
                <Link
                  key={k.id}
                  href={buildHref(sp, { kategori: String(k.id) })}
                  className={cn(
                    'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                    sp.kategori === String(k.id)
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-300'
                  )}
                >
                  {k.nama}
                </Link>
              ))}
            </div>
          )}

          {hasFilter && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-neutral-500">Filter aktif</span>
              <Link href="/kerja" className="font-medium text-primary-600 hover:underline">
                Reset
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {tasks && tasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/kerja/${task.id}`}
                className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-primary-300 hover:shadow-md hover:shadow-primary-500/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                    <Briefcase className="h-3 w-3" />
                    {task.kategori?.nama ?? 'Umum'}
                  </span>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {formatRelativeTime(task.created_at)}
                  </span>
                </div>

                <h3 className="mt-3 line-clamp-2 text-base font-semibold text-neutral-900 group-hover:text-primary-700">
                  {task.judul}
                </h3>

                <p className="mt-1.5 flex items-center gap-1 text-sm text-neutral-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {task.kecamatan?.nama ?? '-'}
                </p>

                {task.deskripsi && (
                  <p className="mt-2.5 line-clamp-2 text-sm text-neutral-500">
                    {task.deskripsi}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3.5">
                  <span className="text-base font-bold text-primary-700">
                    {formatRupiah(task.upah)}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-neutral-400 group-hover:text-primary-600">
                    Detail <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
              <Inbox className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">
              {hasFilter ? 'Tidak ada lowongan yang cocok' : 'Belum ada lowongan terbuka'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-neutral-500">
              {hasFilter
                ? 'Coba ubah kata kunci atau filter pencarianmu.'
                : 'Jadi yang pertama posting kebutuhan tenaga kerja di kecamatanmu.'}
            </p>
            {hasFilter ? (
              <Link href="/kerja" className="mt-4 text-sm font-medium text-primary-600 hover:underline">
                Reset semua filter
              </Link>
            ) : (
              <Link
                href="/kerja/posting"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
              >
                <Plus className="h-4 w-4" /> Posting Kerja Pertama
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <Link
        href="/kerja/posting"
        className="fixed bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/40 active:scale-95 sm:hidden"
        aria-label="Posting Kerja"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}