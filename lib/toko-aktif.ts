import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

export const COOKIE_TOKO_AKTIF = 'toko_aktif';

export type TokoSaya = {
  id: string;
  nama_toko: string;
  status_verifikasi: string;
  [kolom: string]: unknown;
};

function kolomSelect(kolom: string): string {
  const set = new Set(['id', ...kolom.split(',').map((k) => k.trim()).filter(Boolean)]);
  return Array.from(set).join(', ');
}

/** Semua toko milik penjual (toko yang sudah dihapus otomatis tidak ikut, lewat RLS). */
export async function semuaToko(supabase: SupabaseClient, penjualId: string): Promise<TokoSaya[]> {
  const { data } = await supabase
    .from('toko')
    .select('id, nama_toko, status_verifikasi')
    .eq('penjual_id', penjualId)
    .order('created_at', { ascending: true });
  return (data ?? []) as unknown as TokoSaya[];
}

/**
 * Toko yang sedang dipilih penjual (cookie), atau toko pertama bila belum memilih.
 * Bentuk hasil sama dengan query Supabase: { data }.
 */
export async function tokoAktif(
  supabase: SupabaseClient,
  penjualId: string,
  kolom = 'id'
): Promise<{ data: TokoSaya | null }> {
  const { data } = await supabase
    .from('toko')
    .select(kolomSelect(kolom))
    .eq('penjual_id', penjualId)
    .order('created_at', { ascending: true });
  const daftar = (data ?? []) as unknown as TokoSaya[];
  if (daftar.length === 0) return { data: null };
  const dipilih = (await cookies()).get(COOKIE_TOKO_AKTIF)?.value;
  return { data: daftar.find((t) => t.id === dipilih) ?? daftar[0] };
}