'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function ke(path: string, kv: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(kv).toString()}`);
}

async function sesi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function tambahKeKeranjang(produkId: string, formData: FormData): Promise<void> {
  const { supabase } = await sesi();
  const jumlah = Math.max(1, Math.floor(Number(formData.get('jumlah') ?? 1)) || 1);
  const hal = `/marketplace/produk/${produkId}`;

  const { error } = await supabase.rpc('rpc_tambah_keranjang', { p_produk_id: produkId, p_jumlah: jumlah });
  if (error) ke(hal, { error: error.message });

  revalidatePath('/marketplace', 'layout');
  ke(hal, { ok: 'Ditambahkan ke keranjang' });
}

export async function updateJumlahKeranjang(itemId: string, jumlah: number): Promise<void> {
  const { supabase } = await sesi();

  if (jumlah < 1) {
    await supabase.from('keranjang_item').delete().eq('id', itemId);
  } else {
    const { data: item } = await supabase.from('keranjang_item').select('produk_id').eq('id', itemId).maybeSingle();
    if (item) {
      const { data: pr } = await supabase
        .from('produk')
        .select('stok')
        .eq('id', (item as { produk_id: string }).produk_id)
        .maybeSingle();
      const stok = Number((pr as { stok: number } | null)?.stok ?? jumlah);
      const baru = Math.min(jumlah, stok);
      if (baru < 1) {
        await supabase.from('keranjang_item').delete().eq('id', itemId);
      } else {
        await supabase.from('keranjang_item').update({ jumlah: baru }).eq('id', itemId);
      }
    }
  }

  revalidatePath('/marketplace', 'layout');
  redirect('/marketplace/keranjang');
}

export async function hapusDariKeranjang(itemId: string): Promise<void> {
  const { supabase } = await sesi();
  await supabase.from('keranjang_item').delete().eq('id', itemId);
  revalidatePath('/marketplace', 'layout');
  redirect('/marketplace/keranjang');
}

export async function buatPesanan(formData: FormData): Promise<void> {
  const { supabase } = await sesi();
  const alamat = String(formData.get('alamat') ?? '').trim();

  const { data, error } = await supabase.rpc('rpc_checkout', { p_alamat: alamat });
  if (error) ke('/marketplace/checkout', { error: error.message });

  const n = Array.isArray(data) ? data.length : 1;
  revalidatePath('/marketplace', 'layout');
  ke('/marketplace/pesanan', {
    ok: `${n} pesanan dibuat. Selesaikan pembayaran agar penjual mulai memproses`,
  });
}

export async function bayarPesanan(pesananId: string): Promise<void> {
  const { supabase } = await sesi();
  const { error } = await supabase.rpc('rpc_bayar_pesanan', { p_pesanan_id: pesananId });
  if (error) ke('/marketplace/pesanan', { error: error.message });

  revalidatePath('/', 'layout');
  ke('/marketplace/pesanan', { ok: 'Pembayaran diterima. Dana ditahan sampai pesanan kamu terima' });
}

export async function batalkanPesanan(pesananId: string): Promise<void> {
  const { supabase } = await sesi();
  const { error } = await supabase.rpc('rpc_batalkan_pesanan', { p_pesanan_id: pesananId });
  if (error) ke('/marketplace/pesanan', { error: error.message });

  revalidatePath('/', 'layout');
  ke('/marketplace/pesanan', { ok: 'Pesanan dibatalkan' });
}

export async function konfirmasiTerima(pesananId: string): Promise<void> {
  const { supabase } = await sesi();
  const { error } = await supabase.rpc('rpc_konfirmasi_terima', { p_pesanan_id: pesananId });
  if (error) ke('/marketplace/pesanan', { error: error.message });

  revalidatePath('/', 'layout');
  ke('/marketplace/pesanan', { ok: 'Terima kasih! Dana sudah diteruskan ke penjual' });
}

export async function statusPesananPenjual(pesananId: string, status: string): Promise<void> {
  const { supabase } = await sesi();
  const { error } = await supabase.rpc('rpc_status_pesanan_penjual', {
    p_pesanan_id: pesananId,
    p_status: status,
  });
  if (error) ke('/toko-saya/pesanan-masuk', { error: error.message });

  revalidatePath('/', 'layout');
  ke('/toko-saya/pesanan-masuk', {
    ok: status === 'diproses' ? 'Pesanan sedang diproses' : 'Pesanan ditandai dikirim',
  });
}

export async function kirimUlasan(produkId: string, formData: FormData): Promise<void> {
  const { supabase, user } = await sesi();
  const hal = `/marketplace/produk/${produkId}`;
  const rating = Math.round(Number(formData.get('rating')));
  const komentar = String(formData.get('komentar') ?? '').trim().slice(0, 500);

  if (!(rating >= 1 && rating <= 5)) ke(hal, { error: 'Pilih bintang 1 sampai 5' });

  const { error } = await supabase.from('ulasan_produk').insert({
    produk_id: produkId,
    pembeli_id: user.id,
    rating,
    komentar: komentar || null,
  });
  if (error) {
    ke(hal, {
      error:
        error.code === '23505'
          ? 'Kamu sudah memberi ulasan untuk produk ini'
          : error.code === '42501'
          ? 'Ulasan hanya untuk pembeli yang pesanannya sudah selesai'
          : error.message,
    });
  }

  revalidatePath(hal);
  ke(hal, { ok: 'Ulasan terkirim, terima kasih!' });
}