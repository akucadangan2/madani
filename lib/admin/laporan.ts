import type { createClient } from '@/lib/supabase/server';

type Sb = Awaited<ReturnType<typeof createClient>>;

export type TrxLaporan = {
  id: string;
  tipe: string;
  status: string;
  jumlah_total: number | string;
  kecamatan_id: string | null;
  created_at: string;
};

// Bulan berjalan menurut WIB, format YYYY-MM
export function bulanSekarang(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 7);
}

export function bulanValid(b: string | null | undefined): string {
  return b && /^\d{4}-(0[1-9]|1[0-2])$/.test(b) ? b : bulanSekarang();
}

export function geserBulan(bulan: string, delta: number): string {
  const [y, m] = bulan.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function namaBulan(bulan: string): string {
  const [y, m] = bulan.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function rentang(bulan: string) {
  return {
    awal: new Date(`${bulan}-01T00:00:00+07:00`).toISOString(),
    akhir: new Date(`${geserBulan(bulan, 1)}-01T00:00:00+07:00`).toISOString(),
  };
}

export async function ambilTransaksi(supabase: Sb, bulan: string) {
  const { awal, akhir } = rentang(bulan);
  const { data, error } = await supabase
    .from('transaksi')
    .select('id, tipe, status, jumlah_total, kecamatan_id, created_at')
    .gte('created_at', awal)
    .lt('created_at', akhir)
    .order('created_at', { ascending: false })
    .limit(5000);
  return { rows: (data ?? []) as TrxLaporan[], error: error?.message ?? null };
}