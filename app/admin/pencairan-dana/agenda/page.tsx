import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { rupiah } from '@/lib/admin/data';
import { PilihSemua, TombolAksi } from '../kontrol-massal';
import TombolKonfirm from './tombol-konfirm';

type Row = {
  id: string;
  user_id: string;
  jumlah: number | string;
  bank_nama: string | null;
  bank_rekening: string | null;
  bank_atas_nama: string | null;
  jadwal_cair: string | null;
  biaya_total: number | string | null;
  jumlah_bersih: number | string | null;
  batch_id: string | null;
  batch_kode: string | null;
  nama: string;
};

type Hasil = { total: number; total_jumlah: number; total_bersih?: number; rows: Row[] };

type Paket = {
  id: string;
  kode: string;
  jumlah_item: number;
  total_jumlah: number | string;
  catatan: string | null;
  created_at: string;
};

const BASE = '/admin/pencairan-dana/agenda';

function balik(kv: Record<string, string>) {
  return `${BASE}?${new URLSearchParams(kv).toString()}`;
}

function hariIni() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
}

function tglHari(s: string) {
  return new Date(s + 'T12:00:00+07:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Jakarta',
  });
}

const bersih = (r: Row) => Number(r.jumlah_bersih ?? r.jumlah);

// ---------- Aksi ----------

async function buatPaket(formData: FormData): Promise<void> {
  'use server';
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  const catatan = String(formData.get('catatan') ?? '').trim();
  if (ids.length === 0) redirect(balik({ error: 'Centang minimal satu permintaan' }));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('rpc_admin_buat_batch', { p_ids: ids, p_catatan: catatan || null });
  if (error) redirect(balik({ error: error.message }));
  revalidatePath('/admin', 'layout');
  const h = (data ?? {}) as { kode?: string; jumlah_item?: number };
  redirect(balik({ ok: `Paket ${h.kode ?? ''} dibuat berisi ${h.jumlah_item ?? ids.length} transfer` }));
}

async function paketJatuhTempo(): Promise<void> {
  'use server';
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('rpc_admin_daftar_pencairan', {
    p_status: 'disetujui',
    p_q: null,
    p_limit: 200,
    p_offset: 0,
  });
  if (error) redirect(balik({ error: error.message }));
  const rows = ((data ?? {}) as Hasil).rows ?? [];
  const h = hariIni();
  const ids = rows.filter((r) => !r.batch_id && r.jadwal_cair && r.jadwal_cair <= h).map((r) => r.id);
  if (ids.length === 0) redirect(balik({ error: 'Tidak ada transfer jatuh tempo yang belum masuk paket' }));
  const res = await supabase.rpc('rpc_admin_buat_batch', { p_ids: ids, p_catatan: null });
  if (res.error) redirect(balik({ error: res.error.message }));
  revalidatePath('/admin', 'layout');
  const k = (res.data ?? {}) as { kode?: string; jumlah_item?: number };
  redirect(balik({ ok: `Paket ${k.kode ?? ''} dibuat dari ${k.jumlah_item ?? ids.length} transfer jatuh tempo` }));
}

async function selesaikanPaket(formData: FormData): Promise<void> {
  'use server';
  const id = String(formData.get('batch') ?? '');
  const ref = String(formData.get('ref') ?? '').trim();
  if (!id) redirect(balik({ error: 'Data tidak valid' }));
  if (!ref) redirect(balik({ error: 'Isi nomor referensi transfer' }));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('rpc_admin_selesaikan_batch', { p_batch: id, p_ref: ref });
  if (error) redirect(balik({ error: error.message }));
  revalidatePath('/admin', 'layout');
  redirect(balik({ ok: `${data ?? 0} permintaan ditandai sudah ditransfer` }));
}

async function batalkanPaket(formData: FormData): Promise<void> {
  'use server';
  const id = String(formData.get('batch') ?? '');
  if (!id) redirect(balik({ error: 'Data tidak valid' }));
  const supabase = await createClient();
  const { error } = await supabase.rpc('rpc_admin_batalkan_batch', { p_batch: id });
  if (error) redirect(balik({ error: error.message }));
  revalidatePath('/admin', 'layout');
  redirect(balik({ ok: 'Paket dibatalkan. Transfer kembali ke antrean.' }));
}

// ---------- Tampilan ----------

function Kartu({ judul, nilai, sub, nyala }: { judul: string; nilai: string; sub: string; nyala?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${nyala ? 'border-amber-300 bg-amber-50' : 'border-neutral-200 bg-white'}`}>
      <div className="text-xs text-neutral-500">{judul}</div>
      <div className="mt-1 text-lg font-bold text-neutral-900">{nilai}</div>
      <div className="text-xs text-neutral-500">{sub}</div>
    </div>
  );
}

function Tabel({ rows, pilih }: { rows: Row[]; pilih?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            {pilih && <th className="w-10 px-3 py-2" />}
            <th className="px-3 py-2">Pengguna</th>
            <th className="px-3 py-2">Rekening tujuan</th>
            <th className="px-3 py-2 text-right">Diajukan</th>
            <th className="px-3 py-2 text-right">Potongan</th>
            <th className="px-3 py-2 text-right">Transfer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-neutral-50/60">
              {pilih && (
                <td className="px-3 py-2 align-top">
                  <input
                    type="checkbox"
                    name="ids"
                    value={r.id}
                    form="batch"
                    aria-label={`Pilih ${r.nama}`}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300"
                  />
                </td>
              )}
              <td className="px-3 py-2 align-top font-medium text-neutral-900">{r.nama}</td>
              <td className="px-3 py-2 align-top">
                <div className="font-medium text-neutral-800">
                  {r.bank_nama ?? '-'} <span className="font-mono">{r.bank_rekening ?? '-'}</span>
                </div>
                <div className="text-xs text-neutral-500">a.n. {r.bank_atas_nama ?? '-'}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right align-top text-neutral-600">{rupiah(r.jumlah)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right align-top text-neutral-600">
                {Number(r.biaya_total ?? 0) > 0 ? rupiah(r.biaya_total ?? 0) : '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right align-top font-semibold text-neutral-900">
                {rupiah(bersih(r))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AgendaTransfer({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [antrean, menunggu, paketRes] = await Promise.all([
    supabase.rpc('rpc_admin_daftar_pencairan', { p_status: 'disetujui', p_q: null, p_limit: 200, p_offset: 0 }),
    supabase.rpc('rpc_admin_daftar_pencairan', { p_status: 'menunggu', p_q: null, p_limit: 1, p_offset: 0 }),
    supabase
      .from('penarikan_batch')
      .select('id, kode, jumlah_item, total_jumlah, catatan, created_at')
      .eq('status', 'draft')
      .order('created_at', { ascending: false }),
  ]);

  const A = (antrean.data ?? { total: 0, total_jumlah: 0, rows: [] }) as Hasil;
  const M = (menunggu.data ?? { total: 0, total_jumlah: 0, rows: [] }) as Hasil;
  const paket = (paketRes.data ?? []) as Paket[];
  const semua = A.rows ?? [];

  const h = hariIni();
  const bebas = semua.filter((r) => !r.batch_id);
  const terlambat = bebas.filter((r) => r.jadwal_cair && r.jadwal_cair < h);
  const hariIniList = bebas.filter((r) => r.jadwal_cair === h);
  const jatuhTempo = [...terlambat, ...hariIniList];
  const mendatang = bebas.filter((r) => !r.jadwal_cair || r.jadwal_cair > h);

  const perTanggal = new Map<string, Row[]>();
  for (const r of mendatang) {
    const k = r.jadwal_cair ?? '-';
    perTanggal.set(k, [...(perTanggal.get(k) ?? []), r]);
  }
  const tanggalUrut = Array.from(perTanggal.keys()).sort();

  const jumlahBersih = (l: Row[]) => l.reduce((s, r) => s + bersih(r), 0);
  const dalamPaket = (id: string) => semua.filter((r) => r.batch_id === id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Agenda Transfer</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Urutan kerja harian: setujui permintaan, kumpulkan yang jatuh tempo jadi satu paket, transfer, lalu tandai
            selesai.
          </p>
        </div>
        <div className="flex gap-4 text-sm font-medium text-secondary-700">
          <Link href="/admin/pencairan-dana" className="hover:underline">
            Daftar pencairan
          </Link>
          <Link href="/admin/pengaturan-penarikan" className="hover:underline">
            Aturan penarikan
          </Link>
        </div>
      </div>

      {sp.ok && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">{sp.ok}</div>
      )}
      {sp.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{sp.error}</div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kartu
          judul="Menunggu persetujuan"
          nilai={`${M.total} permintaan`}
          sub={rupiah(M.total_jumlah ?? 0)}
          nyala={Number(M.total) > 0}
        />
        <Kartu
          judul="Jatuh tempo (hari ini atau lewat)"
          nilai={`${jatuhTempo.length} transfer`}
          sub={rupiah(jumlahBersih(jatuhTempo))}
          nyala={jatuhTempo.length > 0}
        />
        <Kartu judul="Antrean total" nilai={`${A.total} transfer`} sub={rupiah(A.total_bersih ?? A.total_jumlah ?? 0)} />
        <Kartu judul="Paket belum selesai" nilai={`${paket.length} paket`} sub="siap atau sedang ditransfer" />
      </div>

      {Number(M.total) > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Ada {M.total} permintaan menunggu persetujuan.{' '}
          <Link href="/admin/pencairan-dana?tab=menunggu" className="font-semibold underline">
            Buka daftar
          </Link>
        </div>
      )}

      {/* Paket draft */}
      {paket.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-neutral-900">Paket transfer</h2>
          {paket.map((p) => {
            const isi = dalamPaket(p.id);
            return (
              <div key={p.id} className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-sm font-bold text-neutral-900">{p.kode}</div>
                    <div className="text-xs text-neutral-600">
                      {p.jumlah_item} transfer, total {rupiah(p.total_jumlah)}
                      {p.catatan ? ` - ${p.catatan}` : ''}
                    </div>
                  </div>
                  <a
                    href={`/admin/pencairan-dana/export?batch=${p.id}`}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
                  >
                    <Download className="h-4 w-4" />
                    Unduh CSV paket
                  </a>
                </div>
                {isi.length > 0 && <Tabel rows={isi} />}
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                  <form action={selesaikanPaket} className="flex flex-1 flex-col gap-2 lg:flex-row lg:items-center">
                    <input type="hidden" name="batch" value={p.id} />
                    <input
                      name="ref"
                      placeholder="No. referensi transfer, mis. TRF-21NOV-01"
                      className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm lg:max-w-sm"
                    />
                    <TombolKonfirm
                      teks="Tandai paket sudah ditransfer"
                      konfirmasi={`Tandai semua ${p.jumlah_item} transfer di paket ${p.kode} sudah ditransfer? Pengguna akan menerima notifikasi.`}
                      kelas="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    />
                  </form>
                  <form action={batalkanPaket}>
                    <input type="hidden" name="batch" value={p.id} />
                    <TombolKonfirm
                      teks="Batalkan paket"
                      konfirmasi={`Batalkan paket ${p.kode}? Transfer di dalamnya kembali ke antrean.`}
                      kelas="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                    />
                  </form>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Antrean belum masuk paket */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-neutral-900">Antrean transfer (belum masuk paket)</h2>
          {jatuhTempo.length > 0 && (
            <form action={paketJatuhTempo}>
              <TombolKonfirm
                teks={`Buat paket dari ${jatuhTempo.length} transfer jatuh tempo`}
                konfirmasi={`Buat satu paket dari ${jatuhTempo.length} transfer jatuh tempo?`}
                kelas="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              />
            </form>
          )}
        </div>

        {bebas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
            Tidak ada transfer yang menunggu dipaketkan.
          </div>
        ) : (
          <>
            <form id="batch" action={buatPaket} className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-3 lg:flex-row lg:flex-wrap lg:items-center">
              <PilihSemua />
              <input
                name="catatan"
                placeholder="Catatan paket (opsional)"
                className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm lg:max-w-xs"
              />
              <TombolAksi
                aksi="paket"
                teks="Buat paket dari terpilih"
                konfirmasi="Masukkan ke satu paket transfer"
                kelas="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              />
            </form>

            {terlambat.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-red-700">Terlambat ({terlambat.length})</div>
                <Tabel rows={terlambat} pilih />
              </div>
            )}
            {hariIniList.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-amber-800">Hari ini, {tglHari(h)} ({hariIniList.length})</div>
                <Tabel rows={hariIniList} pilih />
              </div>
            )}
            {tanggalUrut.map((t) => (
              <div key={t} className="space-y-2">
                <div className="text-sm font-semibold text-neutral-800">
                  {t === '-' ? 'Tanpa jadwal' : tglHari(t)} ({perTanggal.get(t)!.length}) - {rupiah(jumlahBersih(perTanggal.get(t)!))}
                </div>
                <Tabel rows={perTanggal.get(t)!} pilih />
              </div>
            ))}
          </>
        )}
        {A.total > semua.length && (
          <p className="text-xs text-neutral-500">
            Menampilkan {semua.length} dari {A.total} transfer di antrean. Selesaikan paket yang ada, lalu muat ulang.
          </p>
        )}
      </section>
    </div>
  );
}