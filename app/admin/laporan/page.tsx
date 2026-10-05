import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { rupiah } from '@/lib/admin/data';
import { ambilTransaksi, bulanValid, geserBulan, namaBulan, bulanSekarang } from '@/lib/admin/laporan';

type Agg = { n: number; released: number; held: number };

export default async function AdminLaporan({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  const { bulan: bulanParam } = await searchParams;
  const bulan = bulanValid(bulanParam);

  const supabase = await createClient();
  const [{ rows, error }, { data: kecs }] = await Promise.all([
    ambilTransaksi(supabase, bulan),
    supabase.from('kecamatan').select('id, nama'),
  ]);
  const namaKec = new Map(((kecs ?? []) as { id: string; nama: string }[]).map((k) => [k.id, k.nama]));

  const nilai = (r: { jumlah_total: number | string }) => Number(r.jumlah_total || 0);

  const released = rows.filter((r) => r.status === 'released');
  const held = rows.filter((r) => r.status === 'held');
  const pending = rows.filter((r) => r.status === 'pending');
  const batal = rows.filter((r) => r.status === 'refunded' || r.status === 'gagal');

  const sum = (arr: typeof rows) => arr.reduce((s, r) => s + nilai(r), 0);

  const perKec = new Map<string, Agg>();
  for (const r of rows) {
    const k = r.kecamatan_id ?? '-';
    const a = perKec.get(k) ?? { n: 0, released: 0, held: 0 };
    a.n += 1;
    if (r.status === 'released') a.released += nilai(r);
    if (r.status === 'held') a.held += nilai(r);
    perKec.set(k, a);
  }
  const kecRows = Array.from(perKec.entries())
    .map(([id, a]) => ({ id, nama: id === '-' ? 'Tanpa kecamatan' : namaKec.get(id) ?? '-', ...a }))
    .sort((a, b) => b.released - a.released);
  const maks = Math.max(1, ...kecRows.map((k) => k.released));

  const perTipe = ['kerja', 'marketplace'].map((t) => {
    const arr = rows.filter((r) => r.tipe === t);
    return { tipe: t, n: arr.length, released: sum(arr.filter((r) => r.status === 'released')) };
  });

  const adaBerikut = bulan < bulanSekarang();

  const kartu = [
    { label: 'Selesai (dicairkan)', nilai: rupiah(sum(released)), sub: `${released.length} transaksi`, cls: 'border-green-200 bg-green-50' },
    { label: 'Dana ditahan (escrow)', nilai: rupiah(sum(held)), sub: `${held.length} transaksi`, cls: 'border-amber-200 bg-amber-50' },
    { label: 'Menunggu pembayaran', nilai: String(pending.length), sub: rupiah(sum(pending)), cls: 'border-neutral-200 bg-white' },
    { label: 'Batal / gagal', nilai: String(batal.length), sub: rupiah(sum(batal)), cls: 'border-neutral-200 bg-white' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Laporan</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Rekap transaksi per kecamatan sebagai dasar bagi hasil.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/laporan?bulan=${geserBulan(bulan, -1)}`}
            aria-label="Bulan sebelumnya"
            className="rounded-full border border-neutral-200 bg-white p-2 hover:bg-neutral-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[130px] text-center text-sm font-semibold capitalize text-neutral-900">
            {namaBulan(bulan)}
          </span>
          {adaBerikut ? (
            <Link
              href={`/admin/laporan?bulan=${geserBulan(bulan, 1)}`}
              aria-label="Bulan berikutnya"
              className="rounded-full border border-neutral-200 bg-white p-2 hover:bg-neutral-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="rounded-full border border-neutral-100 p-2 text-neutral-300">
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
          <a
            href={`/admin/laporan/export?bulan=${bulan}`}
            className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            CSV
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Gagal memuat: {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kartu.map((k) => (
          <div key={k.label} className={`rounded-2xl border p-4 ${k.cls}`}>
            <div className="text-xl font-bold text-neutral-900 sm:text-2xl">{k.nilai}</div>
            <div className="mt-0.5 text-sm text-neutral-700">{k.label}</div>
            <div className="text-xs text-neutral-500">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {perTipe.map((t) => (
          <div key={t.tipe} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-sm font-medium capitalize text-neutral-600">
              {t.tipe === 'kerja' ? 'Pasar tenaga kerja' : 'Marketplace barang'}
            </div>
            <div className="mt-1 text-xl font-bold text-neutral-900">{rupiah(t.released)}</div>
            <div className="text-xs text-neutral-500">{t.n} transaksi bulan ini</div>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 className="font-semibold text-neutral-900">Per kecamatan</h2>
          <p className="text-xs text-neutral-500">
            “Dasar bagi hasil” = total transaksi yang sudah selesai dicairkan.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Kecamatan</th>
                <th className="px-4 py-3 text-right font-medium">Transaksi</th>
                <th className="px-4 py-3 font-medium">Dasar bagi hasil</th>
                <th className="px-4 py-3 text-right font-medium">Masih ditahan</th>
              </tr>
            </thead>
            <tbody>
              {kecRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-neutral-500">
                    Belum ada transaksi di bulan ini.
                  </td>
                </tr>
              )}
              {kecRows.map((k) => (
                <tr key={k.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium text-neutral-900">{k.nama}</td>
                  <td className="px-4 py-3 text-right">{k.n}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{rupiah(k.released)}</div>
                    <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${Math.round((k.released / maks) * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-600">{rupiah(k.held)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}