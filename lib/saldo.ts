import type { createClient } from '@/lib/supabase/server';

type Sb = Awaited<ReturnType<typeof createClient>>;

export const MIN_TARIK = 10000;

export async function ambilSaldo(supabase: Sb, userId: string) {
  const [{ data: led }, { data: pen }] = await Promise.all([
    supabase.from('ledger_entries').select('tipe, jumlah').eq('user_id', userId),
    supabase.from('penarikan_dana').select('jumlah').eq('user_id', userId).eq('status', 'menunggu'),
  ]);

  const saldo = ((led ?? []) as { tipe: string; jumlah: number | string }[]).reduce(
    (s, r) => s + (r.tipe === 'kredit' ? Number(r.jumlah) : -Number(r.jumlah)),
    0
  );
  const diproses = ((pen ?? []) as { jumlah: number | string }[]).reduce((s, r) => s + Number(r.jumlah), 0);

  return { saldo, diproses, tersedia: saldo - diproses };
}