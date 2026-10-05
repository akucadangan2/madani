import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, Receipt, Search, ShoppingCart } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { rupiah } from '@/lib/admin/data';

type Produk = {
  id: string;
  nama: string;
  harga: number | string;
  stok: number;
  foto_url: string[] | null;
  toko_id: string;
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; q?: string }>;
}) {
  const { kategori, q: cari = '' } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let query = supabase
    .from('produk')
    .select('id, nama, harga, stok, foto_url, toko_id')
    .eq('status', 'aktif')
    .order('created_at', { ascending: false })
    .limit(60);
  if (kategori) query = query.eq('kategori_id', kategori);
  if (cari) query = query.ilike('nama', `%${cari}%`);

  const [{ data: kategoriList }, { data: produkData, error }, { count: jumlahKeranjang }] = await Promise.all([
    supabase.from('kategori').select('id, nama').eq('tipe', 'produk').order('nama'),
    query,
    supabase.from('keranjang_item').select('*', { count: 'exact', head: true }).eq('pembeli_id', user.id),
  ]);

  const produk = (produkData ?? []) as Produk[];
  const tokoIds = Array.from(new Set(produk.map((p) => p.toko_id)));
  const { data: tokoData } = tokoIds.length
    ? await supabase.from('toko').select('id, nama_toko').in('id', tokoIds)
    : { data: [] as { id: string; nama_toko: string }[] };
  const namaToko = new Map(((tokoData ?? []) as { id: string; nama_toko: string }[]).map((t) => [t.id, t.nama_toko]));

  const chip = (aktif: boolean) =>
    `shrink-0 rounded-full px-3.5 py-1.5 text-sm ${
      aktif ? 'bg-ink-900 text-white' : 'border border-neutral-200 bg-white text-neutral-700'
    }`;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Belanja</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/marketplace/pesanan"
            aria-label="Pesanan saya"
            className="rounded-full border border-neutral-200 bg-white p-2.5 hover:bg-neutral-50"
          >
            <Receipt className="h-5 w-5" />
          </Link>
          <Link
            href="/marketplace/keranjang"
            aria-label="Keranjang"
            className="relative rounded-full border border-neutral-200 bg-white p-2.5 hover:bg-neutral-50"
          >
            <ShoppingCart className="h-5 w-5" />
            {(jumlahKeranjang ?? 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                {jumlahKeranjang}
              </span>
            )}
          </Link>
        </div>
      </div>

      <form action="/marketplace" className="relative mt-4">
        {kategori && <input type="hidden" name="kategori" value={kategori} />}
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          name="q"
          defaultValue={cari}
          placeholder="Cari produk dari tetangga..."
          className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-neutral-400"
        />
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        <Link href="/marketplace" className={chip(!kategori)}>
          Semua
        </Link>
        {((kategoriList ?? []) as { id: string; nama: string }[]).map((k) => (
          <Link key={k.id} href={`/marketplace?kategori=${k.id}`} className={chip(kategori === k.id)}>
            {k.nama}
          </Link>
        ))}
      </div>

      {error && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Gagal memuat produk: {error.message}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {produk.map((p) => {
          const foto = p.foto_url?.[0];
          return (
            <Link
              key={p.id}
              href={`/marketplace/produk/${p.id}`}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md"
            >
              <div className="relative aspect-square bg-neutral-100">
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto} alt={p.nama} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-300">
                    <Package className="h-10 w-10" />
                  </div>
                )}
                {p.stok < 1 && (
                  <span className="absolute left-2 top-2 rounded-full bg-neutral-900/80 px-2 py-0.5 text-[11px] font-medium text-white">
                    Stok habis
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-medium text-neutral-900">{p.nama}</h3>
                <p className="mt-1 text-sm font-bold text-secondary-700">{rupiah(p.harga)}</p>
                <p className="mt-0.5 truncate text-xs text-neutral-500">{namaToko.get(p.toko_id) ?? ''}</p>
              </div>
            </Link>
          );
        })}

        {produk.length === 0 && !error && (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            {cari ? `Tidak ada produk untuk "${cari}".` : 'Belum ada produk.'}
          </div>
        )}
      </div>
    </div>
  );
}