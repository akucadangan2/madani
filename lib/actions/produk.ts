'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'produk-foto';
const MAKS_FOTO = 4;

type HasilForm = { error: string } | { ke: string };

type DataProduk = {
  nama: string;
  deskripsi: string | null;
  kategori_id: string | null;
  harga: number;
  stok: number;
  foto_url: string[];
};

async function konteks() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: toko } = await supabase
    .from('toko')
    .select('id, status_verifikasi')
    .eq('penjual_id', user.id)
    .maybeSingle();
  return {
    supabase,
    user,
    toko: toko as { id: string; status_verifikasi: string } | null,
  };
}

function jalurDariUrl(url: string): string | null {
  const penanda = `/object/public/${BUCKET}/`;
  const i = url.indexOf(penanda);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + penanda.length));
}

function bacaForm(fd: FormData, userId: string): { data: DataProduk } | { error: string } {
  const nama = String(fd.get('nama') ?? '').trim();
  const deskripsi = String(fd.get('deskripsi') ?? '').trim();
  const kategoriId = String(fd.get('kategori_id') ?? '').trim();
  const harga = Number(fd.get('harga'));
  const stok = Number(fd.get('stok'));
  const foto = fd
    .getAll('foto_url')
    .map((v) => String(v))
    .filter((v) => v.length > 0);

  if (nama.length < 3 || nama.length > 120) return { error: 'Nama produk 3 sampai 120 karakter.' };
  if (deskripsi.length > 2000) return { error: 'Deskripsi maksimal 2000 karakter.' };
  if (!Number.isInteger(harga) || harga <= 0 || harga > 100000000) {
    return { error: 'Harga harus angka bulat lebih dari 0.' };
  }
  if (!Number.isInteger(stok) || stok < 0 || stok > 100000) {
    return { error: 'Stok harus angka bulat 0 atau lebih.' };
  }
  if (foto.length > MAKS_FOTO) return { error: `Maksimal ${MAKS_FOTO} foto.` };

  const awalan = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${userId}/`;
  if (foto.some((u) => !u.startsWith(awalan))) return { error: 'Foto tidak valid. Coba upload ulang.' };

  return {
    data: {
      nama,
      deskripsi: deskripsi || null,
      kategori_id: kategoriId || null,
      harga,
      stok,
      foto_url: foto,
    },
  };
}

export async function buatProduk(fd: FormData): Promise<HasilForm> {
  const k = await konteks();
  if (!k) redirect('/login');
  if (!k.toko) return { error: 'Buat toko dulu di halaman Toko saya.' };
  if (k.toko.status_verifikasi !== 'terverifikasi') {
    return { error: 'Toko kamu belum terverifikasi admin, jadi belum bisa menambah produk.' };
  }

  const h = bacaForm(fd, k.user.id);
  if ('error' in h) return { error: h.error };

  const { error } = await k.supabase
    .from('produk')
    .insert({ toko_id: k.toko.id, ...h.data, status: 'aktif' });
  if (error) return { error: 'Gagal menyimpan produk: ' + error.message };

  return { ke: '/toko-saya/produk?ok=' + encodeURIComponent('Produk berhasil ditambahkan.') };
}

export async function ubahProduk(id: string, fd: FormData): Promise<HasilForm> {
  const k = await konteks();
  if (!k) redirect('/login');
  if (!k.toko) return { error: 'Toko tidak ditemukan.' };

  const { data: lama } = await k.supabase
    .from('produk')
    .select('id, foto_url')
    .eq('id', id)
    .eq('toko_id', k.toko.id)
    .maybeSingle();
  if (!lama) return { error: 'Produk tidak ditemukan.' };

  const h = bacaForm(fd, k.user.id);
  if ('error' in h) return { error: h.error };

  const status = String(fd.get('status') ?? 'aktif') === 'nonaktif' ? 'nonaktif' : 'aktif';

  const { error } = await k.supabase
    .from('produk')
    .update({ ...h.data, status })
    .eq('id', id)
    .eq('toko_id', k.toko.id);
  if (error) return { error: 'Gagal menyimpan perubahan: ' + error.message };

  // Hapus file foto yang dibuang dari storage (best effort)
  const fotoLama = ((lama.foto_url ?? []) as string[]).filter((u) => !h.data.foto_url.includes(u));
  const dibuang = fotoLama
    .map(jalurDariUrl)
    .filter((p): p is string => !!p && p.startsWith(k.user.id + '/'));
  if (dibuang.length > 0) await k.supabase.storage.from(BUCKET).remove(dibuang);

  return { ke: '/toko-saya/produk?ok=' + encodeURIComponent('Perubahan disimpan.') };
}

export async function ubahStatusProduk(id: string, status: 'aktif' | 'nonaktif'): Promise<void> {
  const k = await konteks();
  if (!k) redirect('/login');
  if (!k.toko) redirect('/toko-saya');

  const { error } = await k.supabase
    .from('produk')
    .update({ status })
    .eq('id', id)
    .eq('toko_id', k.toko.id);
  if (error) redirect('/toko-saya/produk?error=' + encodeURIComponent('Gagal mengubah status: ' + error.message));

  redirect(
    '/toko-saya/produk?ok=' +
      encodeURIComponent(status === 'aktif' ? 'Produk ditampilkan lagi.' : 'Produk disembunyikan dari marketplace.')
  );
}

export async function hapusProduk(id: string): Promise<void> {
  const k = await konteks();
  if (!k) redirect('/login');
  if (!k.toko) redirect('/toko-saya');

  const { data: p } = await k.supabase
    .from('produk')
    .select('id, foto_url')
    .eq('id', id)
    .eq('toko_id', k.toko.id)
    .maybeSingle();
  if (!p) redirect('/toko-saya/produk?error=' + encodeURIComponent('Produk tidak ditemukan.'));

  const { error } = await k.supabase.from('produk').delete().eq('id', id).eq('toko_id', k.toko.id);

  if (error) {
    // 23503 = masih dipakai pesanan/keranjang, jadi cukup disembunyikan
    if (error.code === '23503') {
      await k.supabase.from('produk').update({ status: 'nonaktif' }).eq('id', id).eq('toko_id', k.toko.id);
      redirect(
        '/toko-saya/produk?ok=' +
          encodeURIComponent('Produk sudah pernah dipesan, jadi tidak dihapus permanen. Produk disembunyikan saja.')
      );
    }
    redirect('/toko-saya/produk?error=' + encodeURIComponent('Gagal menghapus: ' + error.message));
  }

  const jalur = ((p.foto_url ?? []) as string[])
    .map(jalurDariUrl)
    .filter((x): x is string => !!x && x.startsWith(k.user.id + '/'));
  if (jalur.length > 0) await k.supabase.storage.from(BUCKET).remove(jalur);

  redirect('/toko-saya/produk?ok=' + encodeURIComponent('Produk dihapus.'));
}