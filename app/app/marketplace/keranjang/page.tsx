import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { updateJumlahKeranjang, hapusDariKeranjang } from '@/lib/actions/marketplace';
import { rupiah } from '@/lib/admin/data';

type Item = { id: string; produk_id: string; jumlah: number };
type Produk = {
  id: string;
  nama: string;
  harga: number | string;
  stok: number;
  foto_url: string[] | null;
  toko_id: string;
  status: string | null;
};

export default async function KeranjangPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: itemData } = await supabase
    .from('keranjang_item')
    .select('id, produk_id, jumlah')
    .eq('pembeli_id', user.id)
    .order('created_at', { ascending: true });
  const items = (itemData ?? []) as Item[];

  const pids = items.map((i) => i.produk_id);
  const { data: pData } = pids.length
    ? await supabase.from('produk').select('id, nama, harga, stok, foto_url, toko_id, status').in('id', pids)
    : { data: [] as Produk[] };
  const produkMap = new Map(((pData ?? []) as Produk[]).map((p) => [p.id, p]));

  const tokoIds = Array.from(new Set(Array.from(produkMap.values()).map((p) => p.toko_id)));
  const { data: tData } = tokoIds.length
    ? await supabase.from('toko').select('id, nama_toko').in('id', tokoIds)
    : { data: [] as { id: string; nama_toko: string }[] };
  const namaToko = new Map(((tData ?? []) as { id: string; nama_toko: string }[]).map((t) => [t.id, t.nama_toko]));

  // Kelompokkan per toko
  const grup = new Map<string, { nama: string; rows: { item: Item; p: Produk }[] }>();
  const hilang: Item[] = [];
  let total = 0;
  for (const item of items) {
    const p = produkMap.get(item.produk_id);
    if (!p || p.status !== 'aktif') {
      hilang.push(item);
      continue;
    }
    const g = grup.get(p.toko_id) ?? { nama: namaToko.get(p.toko_id) ?? 'Toko', rows: [] };
    g.rows.push({ item, p });
    grup.set(p.toko_id, g);
    total += item.jumlah * Number(p.harga);
  }

  const btn =
    'flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40';

  return (
    <div className="mx-auto max-w-xl px-4 pb-6 pt-6">
      <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Belanja
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold">Keranjang</h1>

      {items.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <ShoppingCart className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-2 text-sm text-neutral-500">Keranjangmu masih kosong.</p>
          <Link href="/marketplace" className="mt-3 inline-block text-sm font-semibold text-secondary-700 underline">
            Mulai belanja
          </Link>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {Array.from(grup.entries()).map(([tokoId, g]) => (
          <section key={tokoId} className="rounded-2xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-4 py-2.5 text-sm font-semibold">{g.nama}</div>
            <div className="divide-y divide-neutral-100">
              {g.rows.map(({ item, p }) => (
                <div key={item.id} className="flex items-center gap-3 p-3.5">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    {p.foto_url?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.foto_url[0]} alt={p.nama} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-300">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-neutral-900">{p.nama}</div>
                    <div className="text-sm font-bold text-secondary-700">{rupiah(p.harga)}</div>
                    {item.jumlah > p.stok && (
                      <div className="text-xs font-medium text-red-600">Stok tersisa {p.stok}</div>
                    )}
                    <div className="mt-1.5 flex items-center gap-2">
                      <form action={updateJumlahKeranjang.bind(null, item.id, item.jumlah - 1)}>
                        <button className={btn} aria-label="Kurangi">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </form>
                      <span className="w-6 text-center text-sm font-medium">{item.jumlah}</span>
                      <form action={updateJumlahKeranjang.bind(null, item.id, item.jumlah + 1)}>
                        <button className={btn} disabled={item.jumlah >= p.stok} aria-label="Tambah">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                  <form action={hapusDariKeranjang.bind(null, item.id)}>
                    <button className="p-2 text-neutral-400 hover:text-red-600" aria-label="Hapus">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        ))}

        {hilang.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-sm text-neutral-500"
          >
            <span>Produk ini sudah tidak tersedia</span>
            <form action={hapusDariKeranjang.bind(null, item.id)}>
              <button className="font-medium text-red-600">Hapus</button>
            </form>
          </div>
        ))}
      </div>

      {grup.size > 0 && (
        <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Total</span>
            <span className="text-xl font-bold">{rupiah(total)}</span>
          </div>
          <Link
            href="/marketplace/checkout"
            className="mt-3 block rounded-2xl bg-ink-900 py-3.5 text-center text-sm font-semibold text-white hover:opacity-90"
          >
            Lanjut ke checkout
          </Link>
        </div>
      )}
    </div>
  );
}