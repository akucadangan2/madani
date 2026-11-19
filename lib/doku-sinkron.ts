import type { SupabaseClient } from '@supabase/supabase-js';
import { cekStatusDoku } from '@/lib/doku';

export type RefBayar = { ref: string; topup: boolean };

/** Cek status ke DOKU; bila SUCCESS, tandai lunas lewat fungsi database yang sama dengan notifikasi. */
export async function sinkronkanRef(admin: SupabaseClient, r: RefBayar): Promise<string> {
  const s = await cekStatusDoku(r.ref);
  if (!s) return 'tidak_ada';
  if (s.status !== 'SUCCESS') return s.status.toLowerCase();
  const { data, error } = await admin.rpc(r.topup ? 'rpc_topup_lunas' : 'rpc_doku_lunas', {
    p_ref: r.ref,
    p_jumlah: s.jumlah,
  });
  if (error) {
    console.error('[doku] sinkron error', r.ref, error.message);
    return 'error';
  }
  if (data !== 'ok' && data !== 'sudah') console.error('[doku] sinkron PERLU DICEK MANUAL', r.ref, data);
  return String(data);
}