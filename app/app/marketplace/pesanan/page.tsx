import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { bayarPesanan, batalkanPesanan, konfirmasiTerima } from '@/lib/actions/marketplace';
import { ajukanKomplain } from '@/lib/actions/komplain';
import { rupiah, waktuRelatif } from '@/lib/admin/data';
import ChatButton from '@/app/app/chat/_components/chat-button';

export const dynamic = 'force-dynamic';

type Pesanan = {
  id: string;
  toko_id: string;
  status: string;
  subtotal: number | string;
  alamat_pengiriman: string | null;
  created_at: string;
  updated_at: string;
};
type PItem = { id: string; pesanan_id: string; produk_id: string | null; nama_produk: string; jumlah: number };
type Toko = { id: string; nama_toko: string; penjual_id: string };
type Komplain = { pesanan_id: string; status: string; alasan: string; putusan_catatan: string | null };

const STATUS: Record<string, { teks: string; cls: string }> = {
  menunggu_pembayaran: { teks: 'Menunggu pembayaran', cls: 'bg-amber-100 text-amber-800' },
  dibayar: { teks: 'Dibayar, menunggu penjual', cls: 'bg-blue-100 text-blue-800' },
  diproses: { teks: 'Diproses penjual', cls: 'bg-blue-100 text-blue-800' },
  dikirim: { teks: 'Dikirim', cls: 'bg-purple-100 text-purple-800' },
  diterima: { teks: 'Diterima', cls: 'bg-green-100 text-green-800' },
  selesai: { teks: 'Selesai', cls: 'bg-green-100 text-green-800' },
  dibatalkan: { teks: 'Dibatalkan', cls: 'bg-neutral-200 text-neutral-600' },
};

const HARI_AUTO = 3;

export default async function PesananPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error: errMsg } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: pData, error } = await supabase
    .from('pesanan')
    .select('id, toko_id, status, subtotal, alamat_pengiriman, created_at, updated_at')
    .eq('pembeli_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  const pesanan = (pData ?? []) as Pesanan[];

  const ids = pesanan.map((p) => p.id);
  const tokoIds = Array.from(new Set(pesanan.map((p) => p.toko_id)));
  const [{ data: iData }, { data: tData }, { data: kData }] = await Promise.all([
    ids.length
      ? supabase.from('pesanan_item').select('id, pesanan_id, produk_id, nama_produk, jumlah').in('pesanan_id', ids)
      : Promise.resolve({ data: [] as PItem[] }),
    tokoIds.length
      ? supabase.from('toko').select('id, nama_toko, penjual_id').in('id', tokoIds)
      : Promise.resolve({ data: [] as Toko[] }),
    ids.length
      ? supabase.from('komplain').select('pesanan_id, status, alasan, putusan_catatan').in('pesanan_id', ids)
      : Promise.resolve({ data: [] as Komplain[] }),
  ]);
  const items = (iData ?? []) as PItem[];
  const tokoMap = new Map(((tData ?? []) as Toko[]).map((t) => [t.id, t]));
  const komplainMap = new Map(((kData ?? []) as Komplain[]).map((k) => [k.pesanan_id, k]));

  return (
    <div className="mx-auto max-w-xl px-4 pb-6 pt-6">
      <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Belanja
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold">Pesanan saya</h1>

      {ok && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          {ok}
        </div>
      )}
      {(errMsg || error) && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {errMsg ?? error?.message}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {pesanan.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            Belum ada pesanan.
          </div>
        )}

        {pesanan.map((p) => {
          const st = STATUS[p.status] ?? { teks: p.status, cls: 'bg-neutral-100 text-neutral-700' };
          const barang = items.filter((i) => i.pesanan_id === p.id);
          const toko = tokoMap.get(p.toko_id);
          const kmp = komplainMap.get(p.id);
          const komplainTerbuka = kmp?.status === 'terbuka';

          const hariLewat = Math.floor((Date.now() - new Date(p.updated_at).getTime()) / 86400000);
          const sisaHari = Math.max(0, HARI_AUTO - hariLewat);

          return (
            <div key={p.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{toko?.nama_toko ?? 'Toko'}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>{st.teks}</span>
              </div>

              <div className="mt-2 space-y-1">
                {barang.map((i) => (
                  <div key={i.id} className="flex justify-between gap-3 text-sm text-neutral-600">
                    <span className="min-w-0 truncate">
                      {i.produk_id && p.status === 'selesai' ? (
                        <Link href={`/marketplace/produk/${i.produk_id}`} className="hover:underline">
                          {i.nama_produk}
                        </Link>
                      ) : (
                        i.nama_produk
                      )}{' '}
                      x {i.jumlah}
                    </span>
                  </div>
                ))}
              </div>

              {p.alamat_pengiriman && (
                <p className="mt-2 line-clamp-2 text-xs text-neutral-500">Dikirim ke: {p.alamat_pengiriman}</p>
              )}

              {/* Status komplain */}
              {kmp && komplainTerbuka && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <div className="font-semibold">Komplain diajukan, menunggu keputusan admin</div>
                  <p className="mt-1 whitespace-pre-wrap">{kmp.alasan}</p>
                  <p className="mt-1">Dana tetap ditahan. Kalau masalahnya sudah beres, kamu bisa menekan tombol diterima.</p>
                </div>
              )}
              {kmp && kmp.status === 'refund' && (
                <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-900">
                  <div className="font-semibold">Komplain disetujui, dana dikembalikan ke saldomu</div>
                  {kmp.putusan_catatan && <p className="mt-1">Catatan admin: {kmp.putusan_catatan}</p>}
                </div>
              )}
              {kmp && kmp.status === 'dicairkan' && (
                <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
                  <div className="font-semibold">Komplain ditolak, dana diteruskan ke penjual</div>
                  {kmp.putusan_catatan && <p className="mt-1">Catatan admin: {kmp.putusan_catatan}</p>}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
                <div>
                  <div className="font-bold">{rupiah(p.subtotal)}</div>
                  <div className="text-xs text-neutral-400">{waktuRelatif(p.created_at)}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {toko && p.status !== 'menunggu_pembayaran' && p.status !== 'dibatalkan' && (
                    <ChatButton
                      lawanId={toko.penjual_id}
                      label={`Pesanan ${toko.nama_toko}`}
                      href="/marketplace/pesanan"
                      teks="Chat penjual"
                      kecil
                    />
                  )}
                  {p.status === 'menunggu_pembayaran' && (
                    <>
                      <form action={batalkanPesanan.bind(null, p.id)}>
                        <button className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                          Batalkan
                        </button>
                      </form>
                      <form action={bayarPesanan.bind(null, p.id)}>
                        <button className="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                          Bayar (simulasi)
                        </button>
                      </form>
                    </>
                  )}
                  {p.status === 'dikirim' && (
                    <form action={konfirmasiTerima.bind(null, p.id)}>
                      <button className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                        Barang sudah diterima
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {p.status === 'dikirim' && !komplainTerbuka && (
                <>
                  <p className="mt-2 text-xs text-neutral-500">
                    {sisaHari > 0
                      ? `Otomatis dianggap diterima sekitar ${sisaHari} hari lagi jika tidak ada komplain.`
                      : 'Segera dianggap diterima otomatis jika tidak ada komplain.'}
                  </p>
                  <details className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-neutral-700">
                      Ada masalah dengan pesanan?
                    </summary>
                    <form action={ajukanKomplain.bind(null, p.id)} className="mt-3 space-y-2">
                      <textarea
                        name="alasan"
                        required
                        minLength={10}
                        maxLength={1000}
                        rows={3}
                        placeholder="Jelaskan masalahnya (barang rusak, tidak sesuai, dll)"
                        className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                      <button className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                        Ajukan komplain
                      </button>
                      <p className="text-xs text-neutral-500">
                        Dana tetap ditahan dan admin yang memutuskan: dikembalikan kepadamu atau diteruskan ke penjual.
                      </p>
                    </form>
                  </details>
                </>
              )}

              {p.status === 'selesai' && !kmp && (
                <p className="mt-2 text-xs text-neutral-500">Ketuk nama produk untuk memberi ulasan.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}