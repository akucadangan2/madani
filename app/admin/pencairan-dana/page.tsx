import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AlertTriangle, Download, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PENARIKAN } from '@/lib/admin/konstanta';
import { hitung, rupiah } from '@/lib/admin/data';
import { PilihSemua, TombolAksi } from './kontrol-massal';

type Row = {
  id: string;
  user_id: string;
  jumlah: number;
  status: string;
  bank_nama: string | null;
  bank_rekening: string | null;
  bank_atas_nama: string | null;
  diproses_at: string | null;
  catatan_admin: string | null;
  created_at: string;
  bukti_ref: string | null;
  selesai_at: string | null;
  nama: string;
  saldo: number;
};

type Hasil = { total: number; total_jumlah: number; rows: Row[] };

type Ringkasan = {
  saldo_user?: number | string;
  menunggu_total?: number | string;
  antrean_total?: number | string;
  selesai_bulan_total?: number | string;
};

const TAB_VALID = ['menunggu', 'disetujui', 'selesai', 'ditolak', 'semua'];

function balik(tab: string, kv: Record<string, string>) {
  const p = new URLSearchParams();
  if (tab) p.set('tab', tab);
  Object.entries(kv).forEach(([k, v]) => p.set(k, v));
  return `/admin/pencairan-dana?${p.toString()}`;
}

function href(tab: string, q: string, halaman = 1) {
  const p = new URLSearchParams({ tab });
  if (q) p.set('q', q);
  if (halaman > 1) p.set('halaman', String(halaman));
  return `/admin/pencairan-dana?${p.toString()}`;
}

function norm(s: string | null) {
  return (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function tgl(v: string | null) {
  return v
    ? new Date(v).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
}

// Aksi massal dari tabel: setuju, tolak, batal (dari antrean), transfer
async function aksiMassal(formData: FormData): Promise<void> {
  'use server';
  const aksi = String(formData.get('aksi') ?? '');
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  const ref = String(formData.get('ref') ?? '').trim();
  const catatan = String(formData.get('catatan') ?? '').trim();
  const tab = String(formData.get('tab') ?? 'menunggu');

  if (ids.length === 0) redirect(balik(tab, { error: 'Centang minimal satu permintaan' }));
  const supabase = await createClient();

  if (aksi === 'transfer') {
    if (!ref) redirect(balik(tab, { error: 'Isi nomor referensi atau catatan transfer' }));
    const { data, error } = await supabase.rpc('rpc_tandai_transfer', { p_ids: ids, p_ref: ref });
    if (error) redirect(balik(tab, { error: error.message }));
    revalidatePath('/admin', 'layout');
    redirect(balik(tab, { ok: `${data ?? ids.length} permintaan ditandai sudah ditransfer` }));
  }

  if (aksi === 'setuju' || aksi === 'tolak' || aksi === 'batal') {
    const setuju = aksi === 'setuju';
    const { data, error } = await supabase.rpc('rpc_proses_pencairan_massal', {
      p_ids: ids,
      p_approve: setuju,
      p_catatan: catatan || null,
    });
    if (error) redirect(balik(tab, { error: error.message }));
    revalidatePath('/admin', 'layout');

    const h = (data ?? {}) as { ok?: number; gagal?: { id: string; alasan: string }[] };
    const ok = h.ok ?? 0;
    const gagal = h.gagal ?? [];
    const kata = setuju
      ? 'disetujui dan masuk antrean transfer'
      : aksi === 'batal'
        ? 'dibatalkan, saldo dikembalikan'
        : 'ditolak';
    if (gagal.length > 0) {
      redirect(balik(tab, { error: `${ok} ${kata}, ${gagal.length} gagal: ${gagal[0].alasan}` }));
    }
    redirect(balik(tab, { ok: `${ok} permintaan ${kata}` }));
  }

  redirect(balik(tab, { error: 'Aksi tidak dikenal' }));
}

function Lencana({ status }: { status: string }) {
  const peta: Record<string, { teks: string; kelas: string }> = {
    menunggu: { teks: 'Menunggu', kelas: 'bg-amber-100 text-amber-800' },
    disetujui: { teks: 'Antrean transfer', kelas: 'bg-blue-100 text-blue-800' },
    selesai: { teks: 'Sudah ditransfer', kelas: 'bg-green-100 text-green-800' },
    ditolak: { teks: 'Ditolak', kelas: 'bg-red-100 text-red-800' },
  };
  const s = peta[status] ?? { teks: status, kelas: 'bg-neutral-100 text-neutral-700' };
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.kelas}`}>
      {s.teks}
    </span>
  );
}

export default async function AdminPencairan({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; halaman?: string }>;
}) {
  const sp = await searchParams;
  const tab: string = TAB_VALID.includes(sp.tab ?? '') ? (sp.tab as string) : PENARIKAN.MENUNGGU;
  const q = (sp.q ?? '').trim().slice(0, 60);
  const bulk = tab === PENARIKAN.MENUNGGU || tab === PENARIKAN.SETUJU;
  const per = bulk ? 100 : 50;
  const halaman = Math.max(1, Math.floor(Number(sp.halaman)) || 1);
  const offset = (halaman - 1) * per;

  const supabase = await createClient();
  const [{ data, error }, cMenunggu, cSetuju, cSelesai, cTolak, { data: ring }] = await Promise.all([
    supabase.rpc('rpc_admin_daftar_pencairan', {
      p_status: tab,
      p_q: q || null,
      p_limit: per,
      p_offset: offset,
    }),
    hitung(supabase, 'penarikan_dana', 'status', PENARIKAN.MENUNGGU),
    hitung(supabase, 'penarikan_dana', 'status', PENARIKAN.SETUJU),
    hitung(supabase, 'penarikan_dana', 'status', PENARIKAN.SELESAI),
    hitung(supabase, 'penarikan_dana', 'status', PENARIKAN.TOLAK),
    supabase.rpc('rpc_admin_ringkasan_dana'),
  ]);

  const R = (ring ?? {}) as Ringkasan;
  const hasil = (data ?? { total: 0, total_jumlah: 0, rows: [] }) as Hasil;
  const rows = hasil.rows ?? [];
  const jumlahHalaman = Math.max(1, Math.ceil(Number(hasil.total) / per));

  const tabs = [
    { key: PENARIKAN.MENUNGGU as string, label: 'Menunggu', n: cMenunggu },
    { key: PENARIKAN.SETUJU as string, label: 'Antrean transfer', n: cSetuju },
    { key: PENARIKAN.SELESAI as string, label: 'Selesai', n: cSelesai },
    { key: PENARIKAN.TOLAK as string, label: 'Ditolak', n: cTolak },
    { key: 'semua', label: 'Semua', n: cMenunggu + cSetuju + cSelesai + cTolak },
  ];

  const kartu = [
    { judul: 'Menunggu persetujuan', nilai: rupiah(R.menunggu_total ?? 0), sub: `${cMenunggu} permintaan` },
    { judul: 'Antrean transfer', nilai: rupiah(R.antrean_total ?? 0), sub: `${cSetuju} permintaan, belum ditransfer` },
    { judul: 'Selesai bulan ini', nilai: rupiah(R.selesai_bulan_total ?? 0), sub: 'sudah ditransfer' },
    { judul: 'Total saldo pengguna', nilai: rupiah(R.saldo_user ?? 0), sub: 'saldo yang masih tercatat' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Pencairan Dana</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Alur: Setujui (saldo dipotong, masuk antrean), transfer berkala, lalu Tandai sudah ditransfer.
          </p>
        </div>
        <Link href="/admin/panduan" className="text-sm font-medium text-secondary-700 hover:underline">
          Lihat panduan keuangan
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kartu.map((k) => (
          <div key={k.judul} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-xs text-neutral-500">{k.judul}</div>
            <div className="mt-1 text-lg font-bold text-neutral-900">{k.nilai}</div>
            <div className="text-xs text-neutral-500">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={href(t.key, '')}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm ${
                tab === t.key
                  ? 'bg-ink-900 text-white'
                  : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-xs font-semibold ${
                  tab === t.key ? 'bg-white/20' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {t.n}
              </span>
            </Link>
          ))}
        </div>

        <form method="get" className="flex items-center gap-2">
          <input type="hidden" name="tab" value={tab} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nama, bank, atau rekening"
            className="w-56 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
            <Search className="h-4 w-4" />
            Cari
          </button>
          {q && (
            <Link href={href(tab, '')} className="text-sm text-neutral-500 hover:underline">
              Hapus
            </Link>
          )}
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Gagal memuat: {error.message}
        </div>
      )}

      {bulk && rows.length > 0 && (
        <div className="sticky top-16 z-20 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
          <form id="batch" action={aksiMassal} className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
            <input type="hidden" name="tab" value={tab} />
            <PilihSemua key={`${tab}-${halaman}-${q}`} />

            {tab === PENARIKAN.SETUJU && (
              <input
                name="ref"
                placeholder="No. referensi transfer, mis. TRF-12NOV-01"
                className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm lg:max-w-xs"
              />
            )}
            <input
              name="catatan"
              placeholder={tab === PENARIKAN.SETUJU ? 'Alasan (untuk Batalkan)' : 'Alasan (untuk Tolak)'}
              className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm lg:max-w-xs"
            />

            {tab === PENARIKAN.MENUNGGU ? (
              <>
                <TombolAksi
                  aksi="setuju"
                  teks="Setujui terpilih"
                  konfirmasi="Setujui. Saldo pengguna langsung dipotong dan masuk Antrean transfer"
                  kelas="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                />
                <TombolAksi
                  aksi="tolak"
                  teks="Tolak terpilih"
                  konfirmasi="Tolak"
                  kelas="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                />
              </>
            ) : (
              <>
                <TombolAksi
                  aksi="transfer"
                  teks="Tandai sudah ditransfer"
                  konfirmasi="Tandai sudah ditransfer"
                  kelas="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                />
                <TombolAksi
                  aksi="batal"
                  teks="Batalkan terpilih"
                  konfirmasi="Batalkan dan kembalikan saldo"
                  kelas="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                />
                <a
                  href="/admin/pencairan-dana/export?status=disetujui"
                  download
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
                >
                  <Download className="h-4 w-4" />
                  Unduh CSV
                </a>
              </>
            )}
          </form>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-600">
        <span>
          {hasil.total > 0
            ? `Menampilkan ${offset + 1}-${offset + rows.length} dari ${hasil.total} permintaan`
            : 'Tidak ada permintaan'}
          {q ? ` untuk "${q}"` : ''}
        </span>
        <span className="font-medium text-neutral-800">Total {rupiah(hasil.total_jumlah ?? 0)}</span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
          Tidak ada permintaan pada tab ini.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                {bulk && <th className="w-10 px-3 py-2" />}
                <th className="px-3 py-2">Diajukan</th>
                <th className="px-3 py-2">Pengguna</th>
                <th className="px-3 py-2">Rekening tujuan</th>
                <th className="px-3 py-2 text-right">Jumlah</th>
                <th className="px-3 py-2 text-right">Saldo</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((r) => {
                const kurang = r.status === PENARIKAN.MENUNGGU && Number(r.saldo) < Number(r.jumlah);
                const beda = norm(r.bank_atas_nama) !== '' && norm(r.bank_atas_nama) !== norm(r.nama);
                return (
                  <tr key={r.id} className={kurang ? 'bg-red-50/70' : 'hover:bg-neutral-50/60'}>
                    {bulk && (
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
                    <td className="whitespace-nowrap px-3 py-2 align-top text-neutral-600">{tgl(r.created_at)}</td>
                    <td className="px-3 py-2 align-top font-medium text-neutral-900">{r.nama}</td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-neutral-800">
                        {r.bank_nama ?? '-'} <span className="font-mono">{r.bank_rekening ?? '-'}</span>
                      </div>
                      <div className="text-xs text-neutral-500">a.n. {r.bank_atas_nama ?? '-'}</div>
                      {beda && (
                        <div className="mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                          Nama rekening beda dari nama pengguna
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right align-top font-semibold text-neutral-900">
                      {rupiah(r.jumlah)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-2 text-right align-top ${
                        kurang ? 'font-semibold text-red-700' : 'text-neutral-600'
                      }`}
                    >
                      {rupiah(r.saldo)}
                      {kurang && (
                        <div className="flex items-center justify-end gap-1 text-[11px]">
                          <AlertTriangle className="h-3 w-3" />
                          Saldo kurang
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Lencana status={r.status} />
                      {r.diproses_at && r.status !== PENARIKAN.MENUNGGU && (
                        <div className="mt-1 text-[11px] text-neutral-500">Disetujui {tgl(r.diproses_at)}</div>
                      )}
                      {r.selesai_at && (
                        <div className="text-[11px] text-neutral-500">Ditransfer {tgl(r.selesai_at)}</div>
                      )}
                      {r.bukti_ref && <div className="font-mono text-[11px] text-neutral-500">{r.bukti_ref}</div>}
                      {r.catatan_admin && <div className="text-[11px] text-neutral-500">Catatan: {r.catatan_admin}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {jumlahHalaman > 1 && (
        <div className="flex items-center justify-between text-sm">
          {halaman > 1 ? (
            <Link
              href={href(tab, q, halaman - 1)}
              className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 hover:bg-neutral-50"
            >
              Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          <span className="text-neutral-600">
            Halaman {halaman} dari {jumlahHalaman}
          </span>
          {halaman < jumlahHalaman ? (
            <Link
              href={href(tab, q, halaman + 1)}
              className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 hover:bg-neutral-50"
            >
              Berikutnya
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}