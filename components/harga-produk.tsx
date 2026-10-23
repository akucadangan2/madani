import { adaDiskon, hargaAktif, persenDiskon, type HargaProdukData } from '@/lib/diskon';

/** Menampilkan harga produk. Bila ada diskon: harga baru, harga lama dicoret, dan persen diskon. */
export default function HargaProduk({
  p,
  fmt,
}: {
  p: HargaProdukData;
  fmt: (n: number) => string;
}) {
  if (!adaDiskon(p)) return <>{fmt(hargaAktif(p))}</>;
  return (
    <>
      {fmt(hargaAktif(p))}
      <span className="ml-1.5 text-xs font-normal text-neutral-400 line-through">{fmt(Number(p.harga))}</span>
      <span className="ml-1.5 rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-bold text-red-600">
        -{persenDiskon(p)}%
      </span>
    </>
  );
}