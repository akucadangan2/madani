import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, MapPin, Package, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { rupiah } from '@/lib/admin/data';

type Produk = { id: string; nama: string; harga: number | string; stok: number; foto_url: string[] | null };

export default async function TokoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: tk } = await supabase
    .from('toko')
    .select('id, nama_toko, deskripsi, kecamatan_id')
    .eq('id', id)
    .maybeSingle();
  if (!tk) notFound();
  const toko = tk as { id: string; nama_toko: string; deskripsi: string | null; kecamatan_id: string | null };

  const [{ data: kec }, { data: pData }] = await Promise.all([
    toko.kecamatan_id
      ? supabase.from('kecamatan').select('nama').eq('id', toko.kecamatan_id).maybeSingle()
      : Promise.resolve({ data: null as { nama: string } | null }),
    supabase
      .from('produk')
      .select('id, nama, harga, stok, foto_url')
      .eq('toko_id', id)
      .eq('status', 'aktif')
      .order('created_at', { ascending: false }),
  ]);
  const produk = (pData ?? []) as Produk[];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 pt-6">
      <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Belanja
      </Link>

      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
          <Store className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold">{toko.nama_toko}</h1>
          {kec?.nama && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-neutral-500">
              <MapPin className="h-3.5 w-3.5" /> Kec. {kec.nama}
            </p>
          )}
          {toko.deskripsi && <p className="mt-2 text-sm text-neutral-600">{toko.deskripsi}</p>}
        </div>
      </div>

      <h2 className="mb-2 mt-6 font-semibold">Produk ({produk.length})</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {produk.map((p) => (
          <Link
            key={p.id}
            href={`/marketplace/produk/${p.id}`}
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md"
          >
            <div className="relative aspect-square bg-neutral-100">
              {p.foto_url?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.foto_url[0]} alt={p.nama} className="h-full w-full object-cover" />
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
            </div>
          </Link>
        ))}
        {produk.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            Toko ini belum punya produk.
          </div>
        )}
      </div>
    </div>
  );
}