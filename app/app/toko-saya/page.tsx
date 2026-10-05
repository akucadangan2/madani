import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Store, Package, ShoppingBag, Plus, ArrowRight, Clock, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import BuatTokoForm from './buat-toko-form';

export const dynamic = 'force-dynamic';

type Produk = {
  id: string;
  nama: string;
  harga: number | string;
  stok: number | null;
  status: string;
  foto_url: string[] | null;
};

export default async function TokoSayaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data: toko } = await supabase
    .from('toko')
    .select('id, nama_toko, status_verifikasi')
    .eq('penjual_id', user.id)
    .maybeSingle();

  // Belum punya toko: onboarding
  if (!toko) {
    const { data: kecamatanList } = await supabase.from('kecamatan').select('id, nama').order('nama');

    return (
      <div className="mx-auto max-w-md px-4 pt-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-50">
            <Store className="h-7 w-7 text-secondary-600" />
          </div>
          <h1 className="text-center font-display text-xl font-bold text-neutral-900">Buat Toko Kamu</h1>
          <p className="mt-1.5 text-center text-sm text-neutral-500">
            Satu langkah lagi sebelum kamu bisa mulai jualan ke warga sekitar.
          </p>
          <BuatTokoForm kecamatanList={kecamatanList ?? []} />
        </div>
      </div>
    );
  }

  const aktif = toko.status_verifikasi === 'terverifikasi';

  const [{ data: pData }, { count: produkCount }, { count: perluDiproses }] = await Promise.all([
    supabase
      .from('produk')
      .select('id, nama, harga, stok, status, foto_url')
      .eq('toko_id', toko.id)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('produk').select('id', { count: 'exact', head: true }).eq('toko_id', toko.id),
    supabase
      .from('pesanan')
      .select('id', { count: 'exact', head: true })
      .eq('toko_id', toko.id)
      .eq('status', 'dibayar'),
  ]);
  const produkList = (pData ?? []) as Produk[];

  return (
    <div className="mx-auto max-w-xl px-4 pb-8 pt-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-50">
          <Store className="h-6 w-6 text-secondary-600" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-bold text-neutral-900">{toko.nama_toko}</h1>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              aktif
                ? 'bg-primary-50 text-primary-700'
                : toko.status_verifikasi === 'ditolak'
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {aktif ? 'Toko aktif' : toko.status_verifikasi === 'ditolak' ? 'Ditolak' : 'Menunggu verifikasi'}
          </span>
        </div>
      </div>

      {toko.status_verifikasi === 'menunggu' && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Toko kamu sedang diperiksa admin. Produk bisa ditambah setelah toko terverifikasi.</span>
        </div>
      )}
      {toko.status_verifikasi === 'ditolak' && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Pengajuan toko kamu ditolak admin. Hubungi admin kecamatan untuk info lebih lanjut.</span>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href="/toko-saya/produk" className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-2xl font-bold text-neutral-900">{produkCount ?? 0}</p>
          <p className="text-sm text-neutral-500">Produk</p>
        </Link>
        <Link href="/toko-saya/pesanan-masuk" className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-2xl font-bold text-neutral-900">{perluDiproses ?? 0}</p>
          <p className="text-sm text-neutral-500">Perlu diproses</p>
        </Link>
      </div>

      <Link
        href="/toko-saya/pesanan-masuk"
        className="mt-3 flex items-center justify-between rounded-2xl border border-secondary-100 bg-secondary-50 p-4"
      >
        <span className="text-sm font-semibold text-secondary-700">Kelola pesanan masuk</span>
        <ArrowRight className="h-4 w-4 text-secondary-600" />
      </Link>

      <div className="mb-3 mt-7 flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-neutral-900">Produk terbaru</h2>
        <div className="flex items-center gap-3">
          <Link href="/toko-saya/produk" className="text-sm font-medium text-primary-600 hover:underline">
            Lihat semua
          </Link>
          {aktif && (
            <Link
              href="/toko-saya/produk/baru"
              className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-600"
            >
              <Plus className="h-4 w-4" /> Tambah
            </Link>
          )}
        </div>
      </div>

      {produkList.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {produkList.map((p) => {
            const foto = p.foto_url?.[0];
            return (
              <Link
                key={p.id}
                href={`/toko-saya/produk/${p.id}`}
                className="group rounded-2xl border border-neutral-200 bg-white p-3 transition hover:border-primary-300"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-100">
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={foto} alt={p.nama} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-300">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                  {p.status !== 'aktif' && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                      Disembunyikan
                    </span>
                  )}
                </div>
                <h3 className="mt-2 line-clamp-2 text-sm font-medium text-neutral-900">{p.nama}</h3>
                <p className="mt-1 text-sm font-semibold text-primary-700">
                  Rp {Number(p.harga).toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-neutral-400">Stok: {p.stok ?? 0}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <ShoppingBag className="h-6 w-6 text-neutral-400" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900">Belum ada produk</h3>
          <p className="mt-1 max-w-sm text-sm text-neutral-500">
            Tambahkan produk pertamamu biar bisa langsung dibeli warga sekitar.
          </p>
          {aktif && (
            <Link
              href="/toko-saya/produk/baru"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
            >
              <Plus className="h-4 w-4" /> Tambah produk pertama
            </Link>
          )}
        </div>
      )}
    </div>
  );
}