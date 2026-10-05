import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, Package, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { hapusProduk, ubahStatusProduk } from '@/lib/actions/produk';
import HapusButton from './hapus-button';

export const dynamic = 'force-dynamic';

type Produk = {
  id: string;
  nama: string;
  harga: number | string;
  stok: number | null;
  status: string;
  foto_url: string[] | null;
};

export default async function ProdukSayaPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error: errMsg } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data: toko } = await supabase
    .from('toko')
    .select('id, status_verifikasi')
    .eq('penjual_id', user.id)
    .maybeSingle();
  if (!toko) redirect('/toko-saya');

  const { data } = await supabase
    .from('produk')
    .select('id, nama, harga, stok, status, foto_url')
    .eq('toko_id', toko.id)
    .order('created_at', { ascending: false });
  const produkList = (data ?? []) as Produk[];
  const aktif = toko.status_verifikasi === 'terverifikasi';

  return (
    <div className="mx-auto max-w-xl px-4 pb-8 pt-6">
      <Link href="/toko-saya" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Toko saya
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Produk saya</h1>
        {aktif && (
          <Link
            href="/toko-saya/produk/baru"
            className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" /> Produk baru
          </Link>
        )}
      </div>

      {ok && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          {ok}
        </div>
      )}
      {errMsg && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {errMsg}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {produkList.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            Belum ada produk.
          </div>
        )}

        {produkList.map((p) => {
          const foto = p.foto_url?.[0];
          const tampil = p.status === 'aktif';
          return (
            <div key={p.id} className="rounded-2xl border border-neutral-200 bg-white p-3">
              <div className="flex gap-3">
                <Link
                  href={`/toko-saya/produk/${p.id}`}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100"
                >
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={foto} alt={p.nama} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-300">
                      <Package className="h-6 w-6" />
                    </div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/toko-saya/produk/${p.id}`} className="line-clamp-2 text-sm font-semibold text-neutral-900">
                    {p.nama}
                  </Link>
                  <p className="mt-0.5 text-sm font-semibold text-primary-700">
                    Rp {Number(p.harga).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Stok {p.stok ?? 0} -{' '}
                    <span className={tampil ? 'text-green-700' : 'text-neutral-400'}>
                      {tampil ? 'Tampil' : 'Disembunyikan'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
                <Link
                  href={`/toko-saya/produk/${p.id}`}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Edit
                </Link>
                <form action={ubahStatusProduk.bind(null, p.id, tampil ? 'nonaktif' : 'aktif')}>
                  <button
                    type="submit"
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    {tampil ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </form>
                <form action={hapusProduk.bind(null, p.id)} className="ml-auto">
                  <HapusButton nama={p.nama} />
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}