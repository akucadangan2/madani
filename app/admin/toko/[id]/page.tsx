import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { ambilAdmin } from '@/lib/auth/admin-guard';
import { TOKO } from '@/lib/admin/konstanta';
import { hapusProdukAdmin, hapusTokoAdmin, ubahProdukAdmin, ubahTokoAdmin } from '@/lib/actions/admin-kelola';
import ActionButton from '../../_components/ActionButton';
import StatusBadge from '../../_components/StatusBadge';

export const dynamic = 'force-dynamic';

const LABEL_STATUS: Record<string, string> = {
  [TOKO.MENUNGGU]: 'Menunggu',
  [TOKO.SETUJU]: 'Disetujui',
  [TOKO.TOLAK]: 'Ditolak',
};

const input = 'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm';
const rupiah = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

type Produk = {
  id: string;
  nama: string;
  deskripsi: string | null;
  harga: number;
  stok: number;
  satuan: string | null;
  status: string;
};

export default async function KelolaToko({ params }: { params: Promise<{ id: string }> }) {
  if (!(await ambilAdmin())) redirect('/beranda');
  const { id } = await params;
  const db = createAdminClient();

  const { data: toko } = await db
    .from('toko')
    .select('id, penjual_id, kecamatan_id, nama_toko, deskripsi, status_verifikasi, dihapus_at')
    .eq('id', id)
    .maybeSingle();
  if (!toko) notFound();

  const [{ data: penjual }, { data: kecList }, { data: produkList }] = await Promise.all([
    db.from('profiles').select('full_name, phone').eq('id', toko.penjual_id).maybeSingle(),
    db.from('kecamatan').select('id, nama, kabupaten').order('nama'),
    db
      .from('produk')
      .select('id, nama, deskripsi, harga, stok, satuan, status')
      .eq('toko_id', id)
      .order('created_at', { ascending: false }),
  ]);

  const produk = (produkList ?? []) as Produk[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/toko?tab=semua" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800">
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar toko
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-neutral-900">{toko.nama_toko}</h1>
          <StatusBadge status={toko.status_verifikasi} />
          {toko.dihapus_at && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Dihapus</span>
          )}
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          Penjual: {penjual?.full_name ?? '-'} {penjual?.phone ? `(${penjual.phone})` : ''}
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-neutral-900">Data toko</h2>
        <form action={ubahTokoAdmin} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={toko.id} />
          <label className="text-sm text-neutral-600">
            Nama toko
            <input name="nama_toko" defaultValue={toko.nama_toko} required className={input} />
          </label>
          <label className="text-sm text-neutral-600">
            Status verifikasi
            <select name="status_verifikasi" defaultValue={toko.status_verifikasi} className={input}>
              {(Object.values(TOKO) as string[]).map((s) => (
                <option key={s} value={s}>
                  {LABEL_STATUS[s] ?? s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-neutral-600 sm:col-span-2">
            Kecamatan
            <select name="kecamatan_id" defaultValue={toko.kecamatan_id ?? ''} className={input}>
              {!toko.kecamatan_id && <option value="">(belum diisi)</option>}
              {(kecList ?? []).map((k: { id: string; nama: string; kabupaten: string | null }) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                  {k.kabupaten ? `, ${k.kabupaten}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-neutral-600 sm:col-span-2">
            Deskripsi
            <textarea name="deskripsi" defaultValue={toko.deskripsi ?? ''} rows={3} className={input} />
          </label>
          <div className="sm:col-span-2">
            <button className="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white">Simpan data toko</button>
          </div>
        </form>

        {!toko.dihapus_at && (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <ActionButton
              action={hapusTokoAdmin}
              variant="danger"
              confirmText={`Hapus toko "${toko.nama_toko}"? Toko dan semua produknya disembunyikan dari marketplace. Pastikan tidak ada pesanan yang sedang berjalan.`}
              fields={{ id: toko.id }}
            >
              Hapus toko
            </ActionButton>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-neutral-900">Produk ({produk.length})</h2>
        {produk.length === 0 && <p className="text-sm text-neutral-500">Toko ini belum punya produk.</p>}
        <div className="space-y-2">
          {produk.map((p) => (
            <details key={p.id} className="rounded-xl border border-neutral-200">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3 text-sm">
                <span className="font-medium text-neutral-900">{p.nama}</span>
                <span className="text-neutral-500">
                  {rupiah(Number(p.harga))} · stok {p.stok}
                </span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                    p.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {p.status === 'aktif' ? 'Tampil' : 'Disembunyikan'}
                </span>
              </summary>
              <div className="space-y-3 border-t border-neutral-100 p-4">
                <form action={ubahProdukAdmin} className="grid gap-3 sm:grid-cols-4">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="toko_id" value={toko.id} />
                  <label className="text-sm text-neutral-600 sm:col-span-4">
                    Nama produk
                    <input name="nama" defaultValue={p.nama} required className={input} />
                  </label>
                  <label className="text-sm text-neutral-600">
                    Harga (Rp)
                    <input name="harga" type="number" min={1} defaultValue={Number(p.harga)} required className={input} />
                  </label>
                  <label className="text-sm text-neutral-600">
                    Stok
                    <input name="stok" type="number" min={0} defaultValue={p.stok} required className={input} />
                  </label>
                  <label className="text-sm text-neutral-600">
                    Satuan
                    <input name="satuan" defaultValue={p.satuan ?? ''} className={input} />
                  </label>
                  <label className="text-sm text-neutral-600">
                    Status
                    <select name="status" defaultValue={p.status} className={input}>
                      <option value="aktif">Tampil</option>
                      <option value="nonaktif">Disembunyikan</option>
                    </select>
                  </label>
                  <label className="text-sm text-neutral-600 sm:col-span-4">
                    Deskripsi
                    <textarea name="deskripsi" defaultValue={p.deskripsi ?? ''} rows={2} className={input} />
                  </label>
                  <div className="sm:col-span-4">
                    <button className="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white">Simpan produk</button>
                  </div>
                </form>
                <ActionButton
                  action={hapusProdukAdmin}
                  variant="danger"
                  confirmText={`Hapus produk "${p.nama}"?`}
                  fields={{ id: p.id, toko_id: toko.id }}
                >
                  Hapus produk
                </ActionButton>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}