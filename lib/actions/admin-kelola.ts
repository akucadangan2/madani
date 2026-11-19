'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { ambilAdmin } from '@/lib/auth/admin-guard';
import { TOKO } from '@/lib/admin/konstanta';

const BUCKET = 'produk-foto';

function ke(path: string, kv: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(kv).toString()}`);
}

function teks(fd: FormData, k: string): string {
  return String(fd.get(k) ?? '').trim();
}

function jalurDariUrl(url: string): string | null {
  const penanda = `/object/public/${BUCKET}/`;
  const i = url.indexOf(penanda);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + penanda.length));
}

/* ---------- Wilayah ---------- */

export async function tambahKecamatanDariDaftar(fd: FormData): Promise<void> {
  const cari = teks(fd, 'cari');
  const kv = (o: Record<string, string>) => (cari ? { cari, ...o } : o);
  if (!(await ambilAdmin())) ke('/admin/wilayah', { error: 'Hanya admin yang boleh menambah kecamatan' });

  const kode = teks(fd, 'kode');
  if (!kode) ke('/admin/wilayah', kv({ error: 'Kode wilayah kosong' }));

  const db = createAdminClient();
  const { data: ref } = await db
    .from('wilayah_ref')
    .select('kode, nama, kabupaten, provinsi')
    .eq('kode', kode)
    .limit(1)
    .maybeSingle();
  if (!ref) ke('/admin/wilayah', kv({ error: 'Wilayah tidak ditemukan di daftar resmi' }));

  const { data: ada } = await db.from('kecamatan').select('id').eq('kode', kode).limit(1).maybeSingle();
  if (ada) ke('/admin/wilayah', kv({ error: `Kecamatan ${ref.nama} sudah terdaftar` }));

  const { error } = await db
    .from('kecamatan')
    .insert({ nama: ref.nama, kode: ref.kode, kabupaten: ref.kabupaten, provinsi: ref.provinsi });
  if (error) ke('/admin/wilayah', kv({ error: error.message }));

  revalidatePath('/admin/wilayah');
  ke('/admin/wilayah', kv({ ok: `Kecamatan ${ref.nama} (${ref.kabupaten}) ditambahkan` }));
}

/* ---------- Toko ---------- */

export async function ubahTokoAdmin(fd: FormData): Promise<void> {
  const id = teks(fd, 'id');
  const hal = `/admin/toko/${id}`;
  if (!(await ambilAdmin())) ke('/admin/toko', { error: 'Hanya admin' });

  const nama = teks(fd, 'nama_toko');
  const deskripsi = teks(fd, 'deskripsi');
  const status = teks(fd, 'status_verifikasi');
  const kecamatanId = teks(fd, 'kecamatan_id');

  if (nama.length < 3 || nama.length > 80) ke(hal, { error: 'Nama toko 3 sampai 80 karakter' });
  if (deskripsi.length > 1000) ke(hal, { error: 'Deskripsi maksimal 1000 karakter' });
  if (!(Object.values(TOKO) as string[]).includes(status)) ke(hal, { error: 'Status tidak valid' });

  const baru: Record<string, unknown> = {
    nama_toko: nama,
    deskripsi: deskripsi || null,
    status_verifikasi: status,
  };
  if (kecamatanId) baru.kecamatan_id = kecamatanId;

  const db = createAdminClient();
  const { error } = await db.from('toko').update(baru).eq('id', id);
  if (error) ke(hal, { error: error.message });

  revalidatePath('/admin', 'layout');
  ke(hal, { ok: 'Data toko disimpan' });
}

export async function hapusTokoAdmin(fd: FormData): Promise<void> {
  const id = teks(fd, 'id');
  if (!(await ambilAdmin())) ke('/admin/toko', { error: 'Hanya admin' });

  const db = createAdminClient();
  const { data: toko } = await db.from('toko').select('nama_toko').eq('id', id).maybeSingle();
  const { error } = await db.from('toko').update({ dihapus_at: new Date().toISOString() }).eq('id', id);
  if (error) ke(`/admin/toko/${id}`, { error: error.message });
  await db.from('produk').update({ status: 'nonaktif' }).eq('toko_id', id);

  revalidatePath('/admin', 'layout');
  ke('/admin/toko', { tab: 'semua', ok: `Toko "${toko?.nama_toko ?? ''}" dihapus` });
}

/* ---------- Produk ---------- */

export async function ubahProdukAdmin(fd: FormData): Promise<void> {
  const id = teks(fd, 'id');
  const tokoId = teks(fd, 'toko_id');
  const hal = `/admin/toko/${tokoId}`;
  if (!(await ambilAdmin())) ke('/admin/toko', { error: 'Hanya admin' });

  const nama = teks(fd, 'nama');
  const deskripsi = teks(fd, 'deskripsi');
  const harga = Number(teks(fd, 'harga'));
  const stok = Number(teks(fd, 'stok'));
  const satuan = teks(fd, 'satuan').slice(0, 20);
  const status = teks(fd, 'status') === 'nonaktif' ? 'nonaktif' : 'aktif';

  if (nama.length < 3 || nama.length > 120) ke(hal, { error: 'Nama produk 3 sampai 120 karakter' });
  if (deskripsi.length > 2000) ke(hal, { error: 'Deskripsi maksimal 2000 karakter' });
  if (!Number.isInteger(harga) || harga <= 0 || harga > 100000000) ke(hal, { error: 'Harga harus angka bulat lebih dari 0' });
  if (!Number.isInteger(stok) || stok < 0 || stok > 100000) ke(hal, { error: 'Stok harus angka bulat 0 atau lebih' });

  const db = createAdminClient();
  const { error } = await db
    .from('produk')
    .update({ nama, deskripsi: deskripsi || null, harga, stok, satuan: satuan || null, status })
    .eq('id', id)
    .eq('toko_id', tokoId);
  if (error) ke(hal, { error: error.message });

  revalidatePath(hal);
  ke(hal, { ok: 'Produk disimpan' });
}

export async function hapusProdukAdmin(fd: FormData): Promise<void> {
  const id = teks(fd, 'id');
  const tokoId = teks(fd, 'toko_id');
  const hal = `/admin/toko/${tokoId}`;
  if (!(await ambilAdmin())) ke('/admin/toko', { error: 'Hanya admin' });

  const db = createAdminClient();
  const { data: p } = await db.from('produk').select('id, foto_url').eq('id', id).eq('toko_id', tokoId).maybeSingle();
  if (!p) ke(hal, { error: 'Produk tidak ditemukan' });

  const { error } = await db.from('produk').delete().eq('id', id).eq('toko_id', tokoId);
  if (error) {
    if (error.code === '23503') {
      await db.from('produk').update({ status: 'nonaktif' }).eq('id', id).eq('toko_id', tokoId);
      ke(hal, { ok: 'Produk sudah pernah dipesan, jadi tidak dihapus permanen. Produk disembunyikan.' });
    }
    ke(hal, { error: 'Gagal menghapus: ' + error.message });
  }

  const jalur = ((p.foto_url ?? []) as string[]).map(jalurDariUrl).filter((x): x is string => !!x);
  if (jalur.length > 0) await db.storage.from(BUCKET).remove(jalur);

  revalidatePath(hal);
  ke(hal, { ok: 'Produk dihapus' });
}