import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { rupiah } from '@/lib/admin/data';

type Baris = {
  kecamatan_id: string;
  nama: string;
  jumlah_transaksi: number;
  total_transaksi: number;
  persen_madani: number;
  persen_kecamatan: number;
  bagian_madani: number;
  bagian_kecamatan: number;
  sudah_disetor: number;
  sisa: number;
};

type Setoran = {
  id: string;
  kecamatan_id: string;
  jumlah: number | string;
  bukti_ref: string | null;
  catatan: string | null;
  dibayar_at: string;
};

const POLA_BULAN = /^\d{4}-(0[1-9]|1[0-2])$/;

function bulanIni() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }).slice(0, 7);
}

function geser(bulan: string, n: number) {
  const [y, m] = bulan.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function namaBulan(bulan: string) {
  const [y, m] = bulan.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function balik(bulan: string, kv: Record<string, string>) {
  const p = new URLSearchParams({ bulan });
  Object.entries(kv).forEach(([k, v]) => p.set(k, v));
  return `/admin/setoran-kecamatan?${p.toString()}`;
}

async function catatSetoran(formData: FormData): Promise<void> {
  'use server';
  const kec = String(formData.get('kecamatan_id') ?? '');
  const bulanMentah = String(formData.get('bulan') ?? '');
  const bulan = POLA_BULAN.test(bulanMentah) ? bulanMentah : bulanIni();
  const jumlah = Number(String(formData.get('jumlah') ?? '').replace(/[^\d]/g, ''));
  const ref = String(formData.get('ref') ?? '').trim();

  if (!kec) redirect(balik(bulan, { error: 'Kecamatan tidak valid' }));
  if (!jumlah || jumlah <= 0) redirect(balik(bulan, { error: 'Isi jumlah setoran' }));

  const supabase = await createClient();
  const { error } = await supabase.rpc('rpc_catat_setoran_kecamatan', {
    p_kecamatan_id: kec,
    p_bulan: `${bulan}-01`,
    p_jumlah: jumlah,
    p_ref: ref || null,
    p_catatan: null,
  });
  if (error) redirect(balik(bulan, { error: error.message }));

  revalidatePath('/admin/setoran-kecamatan');
  redirect(balik(bulan, { ok: 'Setoran dicatat' }));
}

export default async function SetoranKecamatan({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  const sp = await searchParams;
  const bulan = sp.bulan && POLA_BULAN.test(sp.bulan) ? sp.bulan : bulanIni();
  const supabase = await createClient();

  const [{ data, error }, { data: riwayatData }] = await Promise.all([
    supabase.rpc('rpc_admin_rekap_kecamatan', { p_bulan: `${bulan}-01` }),
    supabase
      .from('setoran_kecamatan')
      .select('id, kecamatan_id, jumlah, bukti_ref, catatan, dibayar_at')
      .eq('periode', `${bulan}-01`)
      .order('dibayar_at', { ascending: false }),
  ]);

  const rows = (data ?? []) as Baris[];
  const riwayat = (riwayatData ?? []) as Setoran[];
  const namaKec = new Map(rows.map((r) => [r.kecamatan_id, r.nama]));

  const jumlahkan = (f: (r: Baris) => number) => rows.reduce((a, r) => a + Number(f(r)), 0);
  const totalTransaksi = jumlahkan((r) => r.total_transaksi);
  const totalMadani = jumlahkan((r) => r.bagian_madani);
  const totalKecamatan = jumlahkan((r) => r.bagian_kecamatan);
  const totalDisetor = jumlahkan((r) => r.sudah_disetor);
  const totalSisa = jumlahkan((r) => r.sisa);

  const ringkas = [
    { judul: 'Total transaksi dicairkan', nilai: rupiah(totalTransaksi) },
    { judul: 'Bagian MADANI', nilai: rupiah(totalMadani) },
    { judul: 'Bagian kecamatan', nilai: rupiah(totalKecamatan) },
    { judul: 'Belum disetor ke kecamatan', nilai: rupiah(totalSisa) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Setoran Kecamatan</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Rekap bagian kecamatan/mitra per bulan dan pencatatan transfer ke mereka.
          </p>
        </div>
        <Link href="/admin/panduan" className="text-sm font-medium text-secondary-700 hover:underline">
          Lihat panduan keuangan
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/setoran-kecamatan?bulan=${geser(bulan, -1)}`}
          className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          Bulan sebelumnya
        </Link>
        <span className="rounded-full bg-ink-900 px-4 py-1.5 text-sm font-semibold text-white">
          {namaBulan(bulan)}
        </span>
        <Link
          href={`/admin/setoran-kecamatan?bulan=${geser(bulan, 1)}`}
          className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          Bulan berikutnya
        </Link>
        <form method="get" className="flex items-center gap-2">
          <input
            type="month"
            name="bulan"
            defaultValue={bulan}
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <button className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
            Buka
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ringkas.map((k) => (
          <div key={k.judul} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-xs text-neutral-500">{k.judul}</div>
            <div className="mt-1 text-lg font-bold text-neutral-900">{k.nilai}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3 text-xs leading-relaxed text-neutral-600">
        Dihitung dari transaksi yang sudah dicairkan pada bulan ini, memakai persentase di menu Bagi Hasil saat
        halaman dibuka. Angka di ringkasan aplikasi mitra dihitung dari pekerjaan/pesanan selesai, jadi bisa
        sedikit berbeda.
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Gagal memuat: {error.message}
        </div>
      )}

      <div className="space-y-3">
        {rows.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            Belum ada transaksi yang dicairkan pada bulan ini.
          </div>
        )}

        {rows.map((r) => {
          const sisa = Number(r.sisa);
          return (
            <div key={r.kecamatan_id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-neutral-900">{r.nama}</div>
                  <div className="text-sm text-neutral-600">
                    {r.jumlah_transaksi} transaksi dicairkan, total {rupiah(r.total_transaksi)}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    sisa <= 0 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {sisa <= 0 ? 'Lunas' : 'Belum lunas'}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-neutral-500">Bagian MADANI ({Number(r.persen_madani)}%)</dt>
                  <dd className="font-semibold text-neutral-900">{rupiah(r.bagian_madani)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Bagian kecamatan ({Number(r.persen_kecamatan)}%)</dt>
                  <dd className="font-semibold text-neutral-900">{rupiah(r.bagian_kecamatan)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Sudah disetor</dt>
                  <dd className="font-semibold text-neutral-900">{rupiah(r.sudah_disetor)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Sisa</dt>
                  <dd className={`font-semibold ${sisa > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    {rupiah(sisa)}
                  </dd>
                </div>
              </dl>

              {sisa > 0 && (
                <form action={catatSetoran} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="kecamatan_id" value={r.kecamatan_id} />
                  <input type="hidden" name="bulan" value={bulan} />
                  <input
                    name="jumlah"
                    inputMode="numeric"
                    defaultValue={Math.round(sisa)}
                    aria-label="Jumlah setoran"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm sm:w-44"
                  />
                  <input
                    name="ref"
                    placeholder="No. referensi transfer"
                    className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <button className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                    Catat setoran
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {riwayat.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="font-display text-base font-bold text-neutral-900">
            Riwayat setoran {namaBulan(bulan)} (total {rupiah(totalDisetor)})
          </h2>
          <ul className="mt-2 divide-y divide-neutral-100 text-sm">
            {riwayat.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-medium text-neutral-800">{namaKec.get(s.kecamatan_id) ?? '-'}</span>
                <span className="text-neutral-700">{rupiah(s.jumlah)}</span>
                <span className="font-mono text-xs text-neutral-500">{s.bukti_ref ?? '-'}</span>
                <span className="text-xs text-neutral-400">
                  {new Date(s.dibayar_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}