import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, MapPin, Package, Star, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { kirimUlasanToko } from '@/lib/actions/ulasan-toko';
import { rupiah, waktuRelatif } from '@/lib/admin/data';
import HargaProduk from '@/components/harga-produk';

type Produk = {
  id: string;
  nama: string;
  harga: number | string;
  harga_diskon: number | string | null;
  diskon_sampai: string | null;
  satuan: string | null;
  stok: number;
  foto_url: string[] | null;
};

type Ulasan = { id: string; nama: string; rating: number; komentar: string | null; created_at: string };

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

export default async function TokoDetailPage({
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

  const { data: tk } = await supabase
    .from('toko')
    .select('id, nama_toko, deskripsi, kecamatan_id, penjual_id')
    .eq('id', id)
    .maybeSingle();
  if (!tk) notFound();
  const toko = tk as {
    id: string;
    nama_toko: string;
    deskripsi: string | null;
    kecamatan_id: string | null;
    penjual_id: string;
  };

  const [{ data: kec }, { data: pData }, { data: uData }, { data: st }] = await Promise.all([
    toko.kecamatan_id
      ? supabase.from('kecamatan').select('nama').eq('id', toko.kecamatan_id).maybeSingle()
      : Promise.resolve({ data: null as { nama: string } | null }),
    supabase
      .from('produk')
      .select('id, nama, harga, harga_diskon, diskon_sampai, satuan, stok, foto_url')
      .eq('toko_id', id)
      .eq('status', 'aktif')
      .order('created_at', { ascending: false }),
    supabase.rpc('app_ulasan_toko', { p_toko_id: id }),
    supabase.rpc('app_status_ulasan_toko', { p_toko_id: id }),
  ]);
  const produk = (pData ?? []) as Produk[];
  const ulasan = (uData ?? []) as Ulasan[];
  const status = (st ?? { boleh: false, rating: 0, komentar: '' }) as {
    boleh: boolean;
    rating: number;
    komentar: string;
  };
  const rata = ulasan.length ? ulasan.reduce((a, u) => a + Number(u.rating), 0) / ulasan.length : 0;
  const tokoSendiri = toko.penjual_id === user.id;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 pt-6">
      <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Belanja
      </Link>

      {ok && (
        <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          {ok}
        </div>
      )}
      {errMsg && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {errMsg}
        </div>
      )}

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
          {ulasan.length > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
              <Bintang n={rata} /> {rata.toFixed(1)} ({ulasan.length} ulasan)
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
              <p className="mt-1 text-sm font-bold text-secondary-700">
                <HargaProduk p={p} fmt={rupiah} />
                {p.satuan && <span className="ml-1 text-xs font-normal text-neutral-500">/ {p.satuan}</span>}
              </p>
            </div>
          </Link>
        ))}
        {produk.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            Toko ini belum punya produk.
          </div>
        )}
      </div>

      <section className="mt-8">
        <h2 className="font-semibold">Ulasan toko ({ulasan.length})</h2>

        {!tokoSendiri && status.boleh && (
          <form
            action={kirimUlasanToko.bind(null, id)}
            className="mt-3 space-y-3 rounded-2xl border border-neutral-200 bg-white p-4"
          >
            <div className="text-sm font-medium">
              {status.rating > 0 ? 'Ubah ulasan tokomu' : 'Bagaimana pelayanan toko ini?'}
            </div>
            <select
              name="rating"
              defaultValue={String(status.rating > 0 ? status.rating : 5)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="5">5 bintang - Sangat baik</option>
              <option value="4">4 bintang - Baik</option>
              <option value="3">3 bintang - Cukup</option>
              <option value="2">2 bintang - Kurang</option>
              <option value="1">1 bintang - Buruk</option>
            </select>
            <textarea
              name="komentar"
              rows={3}
              maxLength={500}
              defaultValue={status.komentar ?? ''}
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