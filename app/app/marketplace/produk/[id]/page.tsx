import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, Package, ShoppingCart, Star, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { tambahKeKeranjang, kirimUlasan } from '@/lib/actions/marketplace';
import { rupiah, waktuRelatif } from '@/lib/admin/data';
import ChatButton from '@/app/app/chat/_components/chat-button';


type Produk = {
  id: string;
  toko_id: string;
  kategori_id: string | null;
  nama: string;
  deskripsi: string | null;
  harga: number | string;
  stok: number;
  foto_url: string[] | null;
};

type Ulasan = { id: string; rating: number; komentar: string | null; created_at: string; nama: string };

function Bintang({ n }: { n: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(n) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
        />
      ))}
    </span>
  );
}

export default async function ProdukDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error: errMsg } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: pd } = await supabase
    .from('produk')
    .select('id, toko_id, kategori_id, nama, deskripsi, harga, stok, foto_url')
    .eq('id', id)
    .maybeSingle();
  if (!pd) notFound();
  const produk = pd as Produk;

  const [{ data: toko }, { data: kat }, { data: ulasanData }, { data: sudahUlas }, { data: selesai }] =
    await Promise.all([
      supabase.from('toko').select('id, nama_toko, penjual_id').eq('id', produk.toko_id).maybeSingle(),
      produk.kategori_id
        ? supabase.from('kategori').select('nama').eq('id', produk.kategori_id).maybeSingle()
        : Promise.resolve({ data: null as { nama: string } | null }),
      supabase.rpc('rpc_ulasan_produk', { p_produk_id: id }),
      supabase.from('ulasan_produk').select('id').eq('produk_id', id).eq('pembeli_id', user.id).maybeSingle(),
      supabase.from('pesanan').select('id').eq('pembeli_id', user.id).eq('status', 'selesai'),
    ]);

  const tk = toko as { id: string; nama_toko: string; penjual_id: string } | null;
  const ulasan = (ulasanData ?? []) as Ulasan[];
  const rata = ulasan.length ? ulasan.reduce((s, u) => s + u.rating, 0) / ulasan.length : 0;
  const tokoSendiri = tk?.penjual_id === user.id;

  // Boleh memberi ulasan kalau pernah membeli produk ini dan pesanannya selesai
  const pesananSelesaiIds = ((selesai ?? []) as { id: string }[]).map((p) => p.id);
  const { data: pernahBeli } = pesananSelesaiIds.length
    ? await supabase.from('pesanan_item').select('id').eq('produk_id', id).in('pesanan_id', pesananSelesaiIds).limit(1)
    : { data: [] as { id: string }[] };
  const bolehUlas = (pernahBeli ?? []).length > 0 && !sudahUlas;

  const fotos = produk.foto_url ?? [];

  return (
    <div className="mx-auto max-w-xl px-4 pb-6 pt-6">
      <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Belanja
      </Link>

      {ok && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          <span>{ok}</span>
          {ok.includes('keranjang') && (
            <Link href="/marketplace/keranjang" className="shrink-0 font-semibold underline">
              Lihat keranjang
            </Link>
          )}
        </div>
      )}
      {errMsg && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {errMsg}
        </div>
      )}

      <div className="mt-3 overflow-hidden rounded-2xl bg-neutral-100">
        {fotos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotos[0]} alt={produk.nama} className="aspect-square w-full object-cover" />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center text-neutral-300">
            <Package className="h-16 w-16" />
          </div>
        )}
      </div>
      {fotos.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {fotos.slice(1).map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f} src={f} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
          ))}
        </div>
      )}

      <h1 className="mt-4 font-display text-2xl font-bold leading-tight">{produk.nama}</h1>
      <div className="mt-1 text-2xl font-bold text-secondary-700">{rupiah(produk.harga)}</div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
        {ulasan.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Bintang n={rata} /> {rata.toFixed(1)} ({ulasan.length})
          </span>
        )}
        {kat?.nama && <span>{kat.nama}</span>}
        <span>Stok {produk.stok}</span>
      </div>

      {tk && (
        <Link
          href={`/marketplace/toko/${tk.id}`}
          className="mt-4 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 hover:bg-neutral-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
            <Store className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-neutral-900">{tk.nama_toko}</span>
            <span className="block text-xs text-neutral-500">Lihat toko</span>
          </span>
        </Link>
      )}

      {tk && !tokoSendiri && (
        <div className="mt-3">
          <ChatButton
            lawanId={tk.penjual_id}
            label={produk.nama}
            href={`/marketplace/produk/${id}`}
            teks="Chat penjual"
          />
        </div>
      )}

      {produk.deskripsi && <p className="mt-4 whitespace-pre-wrap text-neutral-700">{produk.deskripsi}</p>}

      <div className="mt-5">
        {tokoSendiri ? (
          <div className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600">Ini produk dari tokomu sendiri.</div>
        ) : produk.stok > 0 ? (
          <form action={tambahKeKeranjang.bind(null, id)} className="flex gap-2">
            <input
              type="number"
              name="jumlah"
              defaultValue={1}
              min={1}
              max={produk.stok}
              className="w-20 rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-center text-sm outline-none focus:border-neutral-400"
            />
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink-900 py-3 text-sm font-semibold text-white hover:opacity-90">
              <ShoppingCart className="h-4 w-4" /> Tambah ke keranjang
            </button>
          </form>
        ) : (
          <div className="rounded-2xl bg-red-50 p-4 text-center text-sm font-medium text-red-700">Stok habis</div>
        )}
      </div>

      {/* Ulasan */}
      <section className="mt-8">
        <h2 className="font-semibold">Ulasan ({ulasan.length})</h2>

        {bolehUlas && (
          <form action={kirimUlasan.bind(null, id)} className="mt-3 space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-sm font-medium">Bagaimana produk ini?</div>
            <select
              name="rating"
              defaultValue="5"
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="5">★★★★★ Sangat baik</option>
              <option value="4">★★★★ Baik</option>
              <option value="3">★★★ Cukup</option>
              <option value="2">★★ Kurang</option>
              <option value="1">★ Buruk</option>
            </select>
            <textarea
              name="komentar"
              rows={3}
              maxLength={500}
              placeholder="Tulis ulasan (opsional)"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
            <button className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              Kirim ulasan
            </button>
          </form>
        )}

        <div className="mt-3 space-y-2">
          {ulasan.length === 0 && <p className="text-sm text-neutral-500">Belum ada ulasan.</p>}
          {ulasan.map((u) => (
            <div key={u.id} className="rounded-2xl border border-neutral-200 bg-white p-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-900">{u.nama}</span>
                <span className="text-xs text-neutral-400">{waktuRelatif(u.created_at)}</span>
              </div>
              <div className="mt-1">
                <Bintang n={u.rating} />
              </div>
              {u.komentar && <p className="mt-1.5 text-neutral-600">{u.komentar}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}