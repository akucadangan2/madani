import Link from 'next/link';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { waktuRelatif } from '@/lib/admin/data';
import StatusBadge from '../_components/StatusBadge';
import { ubahBiayaKontak } from '@/lib/actions/admin-pekerja';

export const dynamic = 'force-dynamic';

const PER_HAL = 50;

type Baris = {
  user_id: string;
  nama: string | null;
  phone: string | null;
  skills: string[] | null;
  tarif: number | null;
  satuan_tarif: string | null;
  kecamatan: string | null;
  ktp_status: string | null;
  saldo: number;
  selesai_n: number;
  total_upah: number;
  rating_rata: number | null;
  rating_n: number;
  diblokir: boolean;
  terakhir_aktif: string | null;
  total_baris: number;
};

const rupiah = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(n) || 0);

const TABS = [
  { key: 'semua', label: 'Semua' },
  { key: 'ktp', label: 'KTP terverifikasi' },
  { key: 'belum_ktp', label: 'Belum verifikasi KTP' },
  { key: 'diblokir', label: 'Diblokir' },
];

export default async function AdminPekerja({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; hal?: string }>;
}) {
  const { tab = 'semua', q = '', hal = '1' } = await searchParams;
  const halaman = Math.max(1, Number(hal) || 1);
  const supabase = await createClient();
  const { data: biayaRow } = await supabase
    .from('pengaturan_biaya')
    .select('nilai')
    .eq('kunci', 'biaya_kontak_pekerja')
    .maybeSingle();
  const biayaKontak = Number(biayaRow?.nilai ?? 0);

  const { data, error } = await supabase.rpc('rpc_admin_daftar_pekerja', {
    p_q: q.trim() || null,
    p_tab: tab,
    p_limit: PER_HAL,
    p_offset: (halaman - 1) * PER_HAL,
  });
  const rows = (data ?? []) as Baris[];
  const total = rows[0]?.total_baris ?? 0;
  const jumlahHal = Math.max(1, Math.ceil(Number(total) / PER_HAL));

  const href = (t: string, h: number) =>
    `/admin/pekerja?tab=${t}${q ? `&q=${encodeURIComponent(q)}` : ''}${h > 1 ? `&hal=${h}` : ''}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Pekerja</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Identitas, keahlian, penghasilan, dan status akun pekerja. Penghasilan dihitung dari upah tugas yang sudah selesai.
        </p>
      </div>

      <form action={ubahBiayaKontak} className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Biaya kontak pekerja (Rp)</label>
          <input
            name="biaya"
            inputMode="numeric"
            defaultValue={String(biayaKontak)}
            className="w-40 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button className="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white">Simpan</button>
        <p className="basis-full text-xs text-neutral-500">
          Dipotong dari saldo pemberi kerja, sekali bayar per pekerja. Isi 0 untuk mematikan (kontak gratis). Status sekarang:{' '}
          {biayaKontak > 0 ? `aktif Rp ${biayaKontak.toLocaleString('id-ID')}` : 'mati (gratis)'}.
        </p>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={href(t.key, 1)}
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm ${
                tab === t.key
                  ? 'bg-ink-900 text-white'
                  : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <form action="/admin/pekerja" className="relative">
          <input type="hidden" name="tab" value={tab} />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nama, HP, atau keahlian..."
            className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-neutral-400 sm:w-72"
          />
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Gagal memuat: {error.message}
        </div>
      )}

      <p className="text-sm text-neutral-500">{Number(total)} pekerja</p>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Pekerja</th>
              <th className="px-4 py-3">Keahlian</th>
              <th className="px-4 py-3">KTP</th>
              <th className="px-4 py-3">Pekerjaan selesai</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Saldo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-b border-neutral-100 align-top last:border-0">
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-neutral-900">{r.nama ?? '(tanpa nama)'}</span>
                    {r.diblokir && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Diblokir</span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">{r.phone ?? '-'}</div>
                  <div className="text-xs text-neutral-400">
                    Kec. {r.kecamatan ?? '-'}
                    {r.terakhir_aktif ? ` · aktif ${waktuRelatif(r.terakhir_aktif)}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex max-w-[220px] flex-wrap gap-1">
                    {(r.skills ?? []).length === 0 && <span className="text-xs text-neutral-400">-</span>}
                    {(r.skills ?? []).map((s) => (
                      <span key={s} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                        {s}
                      </span>
                    ))}
                  </div>
                  {r.tarif ? (
                    <div className="mt-1 text-xs text-neutral-500">
                      {rupiah(r.tarif)}
                      {r.satuan_tarif ? ` / ${r.satuan_tarif}` : ''}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {r.ktp_status ? (
                    <StatusBadge status={r.ktp_status} />
                  ) : (
                    <span className="text-xs text-neutral-400">Belum ada</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-900">{Number(r.selesai_n)} tugas</div>
                  <div className="text-xs text-neutral-500">{rupiah(r.total_upah)}</div>
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {r.rating_rata ? `${r.rating_rata} (${Number(r.rating_n)})` : '-'}
                </td>
                <td className="px-4 py-3 text-neutral-700">{rupiah(r.saldo)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/pekerja/${r.user_id}`}
                    className="inline-flex rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Kelola
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">
                  {q ? `Tidak ada pekerja untuk "${q}".` : 'Belum ada pekerja pada tab ini.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {jumlahHal > 1 && (
        <div className="flex items-center justify-between text-sm">
          {halaman > 1 ? (
            <Link href={href(tab, halaman - 1)} className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5">
              Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          <span className="text-neutral-500">
            Halaman {halaman} dari {jumlahHal}
          </span>
          {halaman < jumlahHal ? (
            <Link href={href(tab, halaman + 1)} className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5">
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