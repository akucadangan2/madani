import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';

export type Relasi<T> = T | T[] | null;

export type Lowongan = {
  id: string;
  judul: string;
  upah: number | null;
  created_at: string | null;
  kategori: Relasi<{ nama: string }>;
  kecamatan: Relasi<{ nama: string }>;
};
export type LowonganDetail = Lowongan & { deskripsi: string | null; status: string };

export type Produk = {
  id: string;
  nama: string;
  harga: number | null;
  stok: number | null;
  foto_url: string | string[] | null;
  toko: Relasi<{ nama_toko: string }>;
};
export type ProdukDetail = Produk & { deskripsi: string | null; status: string };

export type Opsi = { id: string; nama: string };

export function satu<T>(v: Relasi<T>): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export function rupiah(n: number | null) {
  return `Rp${Math.round(n ?? 0).toLocaleString('id-ID')}`;
}

export function waktuRelatif(iso: string | null) {
  if (!iso) return '';
  const menit = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (menit < 1) return 'baru saja';
  if (menit < 60) return `${menit} mnt lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function fotoList(v: string | string[] | null): string[] {
  const arr = Array.isArray(v) ? v : v ? [v] : [];
  return arr.filter((f) => typeof f === 'string' && f.startsWith('http'));
}

function bersih(q: string) {
  return q.replace(/[%_\\]/g, ' ').trim().slice(0, 60);
}

function anon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const LOWONGAN_SELECT = 'id, judul, upah, created_at, kategori(nama), kecamatan(nama)';
const PRODUK_SELECT = 'id, nama, harga, stok, foto_url, toko(nama_toko)';

export async function daftarLowongan(opsi: { q?: string; kec?: string }): Promise<Lowongan[]> {
  const sb = anon();
  if (!sb) return [];
  try {
    let qb = sb
      .from('tasks')
      .select(LOWONGAN_SELECT)
      .eq('status', 'terbuka')
      .order('created_at', { ascending: false })
      .limit(30);
    if (opsi.kec) qb = qb.eq('kecamatan_id', opsi.kec);
    const q = bersih(opsi.q ?? '');
    if (q) qb = qb.ilike('judul', `%${q}%`);
    const { data, error } = await qb;
    if (error) console.error('[publik] daftarLowongan:', error.message);
    return (data ?? []) as unknown as Lowongan[];
  } catch (e) {
    console.error('[publik] daftarLowongan gagal:', e);
    return [];
  }
}

export async function daftarKecamatan(): Promise<Opsi[]> {
  const sb = anon();
  if (!sb) return [];
  try {
    const { data, error } = await sb.from('kecamatan').select('id, nama').order('nama');
    if (error) console.error('[publik] daftarKecamatan:', error.message);
    return (data ?? []) as Opsi[];
  } catch (e) {
    console.error('[publik] daftarKecamatan gagal:', e);
    return [];
  }
}

export const ambilLowongan = cache(async (id: string): Promise<LowonganDetail | null> => {
  const sb = anon();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('tasks')
      .select('id, judul, deskripsi, upah, status, created_at, kategori(nama), kecamatan(nama)')
      .eq('id', id)
      .maybeSingle();
    if (error) console.error('[publik] ambilLowongan:', error.message);
    const t = data as unknown as LowonganDetail | null;
    return t && t.status === 'terbuka' ? t : null;
  } catch (e) {
    console.error('[publik] ambilLowongan gagal:', e);
    return null;
  }
});

export async function daftarProduk(opsi: { q?: string }): Promise<Produk[]> {
  const sb = anon();
  if (!sb) return [];
  try {
    let qb = sb
      .from('produk')
      .select(PRODUK_SELECT)
      .eq('status', 'aktif')
      .order('created_at', { ascending: false })
      .limit(40);
    const q = bersih(opsi.q ?? '');
    if (q) qb = qb.ilike('nama', `%${q}%`);
    const { data, error } = await qb;
    if (error) console.error('[publik] daftarProduk:', error.message);
    return (data ?? []) as unknown as Produk[];
  } catch (e) {
    console.error('[publik] daftarProduk gagal:', e);
    return [];
  }
}

export const ambilProduk = cache(async (id: string): Promise<ProdukDetail | null> => {
  const sb = anon();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('produk')
      .select('id, nama, deskripsi, harga, stok, foto_url, status, toko(nama_toko)')
      .eq('id', id)
      .maybeSingle();
    if (error) console.error('[publik] ambilProduk:', error.message);
    const p = data as unknown as ProdukDetail | null;
    return p && p.status === 'aktif' ? p : null;
  } catch (e) {
    console.error('[publik] ambilProduk gagal:', e);
    return null;
  }
});