import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { daftarProduk, fotoList, rupiah, satu } from '@/lib/publik';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Produk dari toko sekitar',
  description: 'Lihat produk terbaru dari penjual satu kecamatan, tanpa perlu login.',
};

export default async function ProdukPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const daftar = await daftarProduk({ q });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-12">
      <h1 className="text-2xl font-extrabold leading-tight text-ink-700 sm:text-4xl">Produk dari toko sekitar</h1>
      <p className="mt-2 max-w-xl text-neutral-600">
        Produk terbaru dari penjual satu kecamatan. Kamu baru perlu daftar saat mau memesan.
      </p>

      <form method="get" className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari produk, mis. nasi uduk"
          className="h-12 flex-1 rounded-full border border-neutral-300 px-5 text-base outline-none focus:border-ink-700"
        />
        <button type="submit" className="h-12 rounded-full bg-ink-700 px-7 font-semibold text-white hover:bg-ink-800">
          Cari
        </button>
      </form>

      {daftar.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-ink-50 p-6 text-neutral-600">
          Belum ada produk yang cocok. Coba kata kunci lain, atau daftar untuk membuka tokomu.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {daftar.map((p) => {
            const foto = fotoList(p.foto_url)[0];
            const habis = (p.stok ?? 0) <= 0;
            return (
              <li key={p.id}>
                <Link
                  href={`/produk/${p.id}`}
                  className="block h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-ink-700"
                >
                  <div className="relative aspect-square bg-ink-50">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={foto} alt={p.nama} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-neutral-400">
                        <ShoppingBag className="h-8 w-8" />
                      </span>
                    )}
                    {habis && (
                      <span className="absolute left-2 top-2 rounded bg-white px-2 py-0.5 text-xs font-semibold text-neutral-600">
                        Habis
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-ink-700">{p.nama}</p>
                    <p className="mt-1 font-display text-base font-bold text-ink-700">{rupiah(p.harga)}</p>
                    <p className="mt-0.5 truncate text-xs text-neutral-500">{satu(p.toko)?.nama_toko ?? ''}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10">
        <Link href="/register" className="inline-flex w-full justify-center rounded-full bg-ink-700 px-7 py-3.5 font-semibold text-white hover:bg-ink-800 sm:w-auto">
          Mau memesan atau berjualan? Daftar gratis
        </Link>
      </div>
    </main>
  );
}