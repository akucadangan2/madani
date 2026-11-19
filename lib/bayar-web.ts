import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { buatCheckout } from '@/lib/doku';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.madaniberdaya.com';

type Baris = { ref: string; jumlah: number | string };

function balik(path: string, pesan: string): never {
  redirect(`${path}?${new URLSearchParams({ error: pesan }).toString()}`);
}

/** Mulai pembayaran DOKU dari web: buat tagihan, lalu arahkan pengguna ke halaman bayar DOKU. */
export async function mulaiBayarWeb(jenis: 'pesanan' | 'task', id: string, kembali: string): Promise<never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } =
    jenis === 'pesanan'
      ? await supabase.rpc('rpc_mulai_bayar_pesanan', { p_pesanan_id: id })
      : await supabase.rpc('rpc_mulai_bayar_task', { p_task_id: id });
  if (error) balik(kembali, error.message);

  const baris = (Array.isArray(data) ? data[0] : data) as Baris | undefined;
  if (!baris?.ref) balik(kembali, 'Gagal menyiapkan pembayaran');

  const { data: prof } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();
  const p = (prof ?? {}) as { full_name?: string | null; phone?: string | null };
  const hp = String(p.phone ?? user.phone ?? '').trim();
  const nama = String(p.full_name ?? '').trim();
  const pelanggan = {
    nama: nama || undefined,
    email: user.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) ? user.email : undefined,
    telepon: hp ? (hp.startsWith('+') ? hp : /^62/.test(hp) ? '+' + hp : hp) : undefined,
  };

  let url = '';
  try {
    const hasil = await buatCheckout({
      invoice: baris.ref,
      jumlah: Number(baris.jumlah),
      callbackUrl: `${SITE}/bayar/selesai?ref=${encodeURIComponent(baris.ref)}`,
      pelanggan,
    });
    url = hasil.url;
  } catch (e) {
    console.error('[doku] bayar dari web gagal:', e instanceof Error ? e.message : String(e));
  }
  if (!url) balik(kembali, 'Layanan pembayaran sedang bermasalah, coba lagi');
  redirect(url);
}