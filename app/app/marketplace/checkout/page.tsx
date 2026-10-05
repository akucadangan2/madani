import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { buatPesanan } from '@/lib/actions/marketplace';
import { rupiah } from '@/lib/admin/data';

type Item = { id: string; produk_id: string; jumlah: number };
type Produk = { id: string; nama: string; harga: number | string; toko_id: string; status: string | null };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errMsg } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: itemData } = await supabase
    .from('keranjang_item')
    .select('id, produk_id, jumlah')
    .eq('pembeli_id', user.id);
  const items = (itemData ?? []) as Item[];
  if (items.length === 0) redirect('/marketplace/keranjang');

  const { data: pData } = await supabase
    .from('produk')
    .select('id, nama, harga, toko_id, status')
    .in('id', items.map((i) => i.produk_id));
  const produkMap = new Map(((pData ?? []) as Produk[]).map((p) => [p.id, p]));

  const tokoIds = Array.from(new Set(Array.from(produkMap.values()).map((p) => p.toko_id)));
  const { data: tData } = tokoIds.length
    ? await supabase.from('toko').select('id, nama_toko').in('id', tokoIds)
    : { data: [] as { id: string; nama_toko: string }[] };
  const namaToko = new Map(((tData ?? []) as { id: string; nama_toko: string }[]).map((t) => [t.id, t.nama_toko]));

  const grup = new Map<string, { nama: string; rows: { item: Item; p: Produk }[]; sub: number }>();
  let total = 0;
  for (const item of items) {
    const p = produkMap.get(item.produk_id);
    if (!p) continue;
    const g = grup.get(p.toko_id) ?? { nama: namaToko.get(p.toko_id) ?? 'Toko', rows: [], sub: 0 };
    const sub = item.jumlah * Number(p.harga);
    g.rows.push({ item, p });
    g.sub += sub;
    grup.set(p.toko_id, g);
    total += sub;
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-6 pt-6">
      <Link
        href="/marketplace/keranjang"
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
      >
        <ChevronLeft className="h-4 w-4" /> Keranjang
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold">Checkout</h1>

      {errMsg && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {errMsg}
        </div>
      )}

      <form action={buatPesanan} className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-800">Alamat pengiriman</label>
          <textarea
            name="alamat"
            required
            minLength={10}
            rows={3}
            placeholder="Nama penerima, alamat lengkap, patokan, dan nomor HP"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-neutral-400"
          />
          <p className="mt-1 text-xs text-neutral-500">Barang diantar langsung oleh penjual di kecamatanmu.</p>
        </div>

        {Array.from(grup.entries()).map(([tokoId, g]) => (
          <section key={tokoId} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <h2 className="text-sm font-semibold">{g.nama}</h2>
            <div className="mt-2 space-y-1">
              {g.rows.map(({ item, p }) => (
                <div key={item.id} className="flex justify-between gap-3 text-sm text-neutral-600">
                  <span className="min-w-0 truncate">
                    {p.nama} × {item.jumlah}
                  </span>
                  <span className="shrink-0">{rupiah(item.jumlah * Number(p.harga))}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-sm font-semibold">
              <span>Subtotal</span>
              <span>{rupiah(g.sub)}</span>
            </div>
          </section>
        ))}

        {grup.size > 1 && (
          <p className="text-xs text-neutral-500">
            Belanja dari {grup.size} toko akan dipecah menjadi {grup.size} pesanan terpisah.
          </p>
        )}

        <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Dana ditahan platform sampai kamu menerima barang. <strong>Mode uji coba:</strong> pembayaran
            disimulasikan, belum ada uang sungguhan yang bergerak.
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4">
          <span className="text-sm text-neutral-600">Total</span>
          <span className="text-xl font-bold">{rupiah(total)}</span>
        </div>

        <button className="w-full rounded-2xl bg-ink-900 py-3.5 text-sm font-semibold text-white hover:opacity-90">
          Buat pesanan
        </button>
      </form>
    </div>
  );
}