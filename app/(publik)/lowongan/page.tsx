import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { daftarKecamatan, daftarLowongan, rupiah, satu, waktuRelatif } from '@/lib/publik';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Lowongan kerja terbaru di kecamatanmu',
  description: 'Lihat lowongan kerja harian terbaru dari warga sekitar, tanpa perlu login.',
};

export default async function LowonganPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kec?: string }>;
}) {
  const { q = '', kec = '' } = await searchParams;
  const [daftar, kecamatan] = await Promise.all([daftarLowongan({ q, kec }), daftarKecamatan()]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-12">
      <h1 className="text-2xl font-extrabold leading-tight text-ink-700 sm:text-4xl">Lowongan kerja terbaru</h1>
      <p className="mt-2 max-w-xl text-neutral-600">
        Lowongan dari warga sekitar. Kamu baru perlu daftar saat mau melamar.
      </p>

      <form method="get" className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari lowongan, mis. tukang cat"
          className="h-12 flex-1 rounded-full border border-neutral-300 px-5 text-base outline-none focus:border-ink-700"
        />
        <select
          name="kec"
          defaultValue={kec}
          className="h-12 rounded-full border border-neutral-300 bg-white px-4 text-base outline-none focus:border-ink-700 sm:w-56"
        >
          <option value="">Semua kecamatan</option>
          {kecamatan.map((k) => (
            <option key={k.id} value={k.id}>{k.nama}</option>
          ))}
        </select>
        <button type="submit" className="h-12 rounded-full bg-ink-700 px-7 font-semibold text-white hover:bg-ink-800">
          Cari
        </button>
      </form>

      {daftar.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-ink-50 p-6 text-neutral-600">
          Belum ada lowongan yang cocok. Coba kata kunci atau kecamatan lain, atau daftar untuk memasang lowongan pertamamu.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {daftar.map((t) => {
            const info = [satu(t.kategori)?.nama, satu(t.kecamatan)?.nama].filter(Boolean).join(' · ');
            return (
              <li key={t.id}>
                <Link
                  href={`/lowongan/${t.id}`}
                  className="block h-full rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-ink-700"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700">
                      <Briefcase className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-display text-base font-bold leading-snug text-ink-700">{t.judul}</p>
                      {info && <p className="mt-1 truncate text-sm text-neutral-500">{info}</p>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="rounded-md bg-sun-400 px-2 py-0.5 text-sm font-bold text-ink-800">{rupiah(t.upah)}</span>
                    <span className="text-xs text-neutral-500">{waktuRelatif(t.created_at)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10">
        <Link href="/register" className="inline-flex w-full justify-center rounded-full bg-ink-700 px-7 py-3.5 font-semibold text-white hover:bg-ink-800 sm:w-auto">
          Mau melamar? Daftar gratis
        </Link>
      </div>
    </main>
  );
}