export type HargaProdukData = {
  harga: number | string | null;
  harga_diskon?: number | string | null;
  diskon_sampai?: string | null;
};

/** True bila produk punya harga diskon yang masih berlaku. */
export function adaDiskon(p: HargaProdukData): boolean {
  const h = Number(p.harga ?? 0);
  const d = Number(p.harga_diskon ?? 0);
  if (!(d > 0 && d < h)) return false;
  return !p.diskon_sampai || new Date(p.diskon_sampai).getTime() > Date.now();
}

/** Harga yang dibayar pembeli (diskon bila berlaku). */
export function hargaAktif(p: HargaProdukData): number {
  return adaDiskon(p) ? Number(p.harga_diskon) : Number(p.harga ?? 0);
}

export function persenDiskon(p: HargaProdukData): number {
  if (!adaDiskon(p)) return 0;
  return Math.round((1 - Number(p.harga_diskon) / Number(p.harga)) * 100);
}