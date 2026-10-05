import type { createClient } from '@/lib/supabase/server';

type Sb = Awaited<ReturnType<typeof createClient>>;

export async function hitung(
  supabase: Sb,
  tabel: string,
  kolom?: string,
  nilai?: string
): Promise<number> {
  let q = supabase.from(tabel).select('*', { count: 'exact', head: true });
  if (kolom && nilai) q = q.eq(kolom, nilai);
  const { count, error } = await q;
  if (error) console.error(`[admin] hitung ${tabel}:`, error.message);
  return count ?? 0;
}

export function rupiah(n: number | string): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n));
}

export function waktuRelatif(iso: string): string {
  const menit = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (menit < 1) return 'baru saja';
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID');
}