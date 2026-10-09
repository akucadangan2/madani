import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Store } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/current-user';
import { ambilProduk, fotoList, rupiah, satu } from '@/lib/publik';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await ambilProduk(id);
  if (!p) return { title: 'Produk tidak ditemukan' };
  return {
    title: p.nama,
    description: `${rupiah(p.harga)}. Produk dari toko sekitar di MADANI.`,
  };
}

export default async function ProdukDetailPage({ params }: Props) {
  const { id } = await params;
  const [p, user] = await Promise.all([ambilProduk(id), getCurrentUser()]);
  if (!p) notFound();

  const fotos = fotoList(p.foto_url);
  const toko = satu(p.toko)?.nama_toko;
  const habis = (p.stok ?? 0) <= 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-12">
      <Link href="/produk" className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Semua produk
      </Link>

      <div className="mt-5 grid gap-6 md:grid-cols-2 md:gap-10">
        <div>
          <div className="aspect-square overflow-hidden rounded-[24px] border border-neutral-200 bg-ink-50">
            {fotos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotos[0]} alt={p.nama} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-neutral-400">
                <ShoppingBag className="h-14 w-14" />
              </span>
            )}
          </div>
          {fotos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {fotos.slice(1, 6).map((f) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f} src={f} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl border border-neutral-200 object-cover" />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl">{p.nama}</h1>
          <p className="mt-3 font-display text-3xl font-bold text-ink-700">{rupiah(p.harga)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            {toko && (
              <span className="inline-flex items-center gap-1.5">
                <Store className="h-4 w-4" /> {toko}
              </span>
            )}
            <span className={`rounded-full px-3 py-1 font-medium ${habis ? 'bg-neutral-100 text-neutral-600' : 'bg-primary-500/20 text-ink-800'}`}>
              {habis ? 'Stok habis' : `Stok ${p.stok}`}
            </span>
          </div>

          <h2 className="mt-6 font-display text-lg font-bold text-ink-700">Deskripsi</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-neutral-700">
            {p.deskripsi?.trim() || 'Penjual belum menambahkan deskripsi.'}
          </p>

          <div className="mt-7 rounded-2xl bg-ink-50 p-5">
            {user ? (
              <>
                <p className="font-display text-lg font-bold text-ink-700">Tertarik dengan produk ini?</p>
                <p className="mt-1 text-sm text-neutral-600">Buka beranda untuk memesan atau bertanya ke penjual.</p>
                <Link href="/beranda" className="mt-4 inline-flex w-full justify-center rounded-full bg-ink-700 px-7 py-3.5 font-semibold text-white hover:bg-ink-800 sm:w-auto">
                  Ke beranda
                </Link>
              </>
            ) : (
              <>
                <p className="font-display text-lg font-bold text-ink-700">Mau memesan produk ini?</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Daftar gratis lewat kode WhatsApp untuk memesan dan chat dengan penjual.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link href="/register" className="inline-flex justify-center rounded-full bg-ink-700 px-7 py-3.5 font-semibold text-white hover:bg-ink-800">
                    Daftar untuk memesan
                  </Link>
                  <Link href="/login" className="inline-flex justify-center rounded-full border-2 border-ink-700 px-7 py-3.5 font-semibold text-ink-700 hover:bg-white">
                    Saya sudah punya akun
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}