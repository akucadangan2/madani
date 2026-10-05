import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { statusPesananPenjual } from '@/lib/actions/marketplace';
import { rupiah, waktuRelatif } from '@/lib/admin/data';
import ChatButton from '@/app/app/chat/_components/chat-button';

export const dynamic = 'force-dynamic';

type Pesanan = {
  id: string;
  pembeli_id: string;
  status: string;
  subtotal: number | string;
  alamat_pengiriman: string | null;
  created_at: string;
};
type PItem = { id: string; pesanan_id: string; nama_produk: string; jumlah: number };
type Komplain = { pesanan_id: string; status: string; alasan: string; putusan_catatan: string | null };

const STATUS: Record<string, { teks: string; cls: string }> = {
  dibayar: { teks: 'Perlu diproses', cls: 'bg-amber-100 text-amber-800' },
  diproses: { teks: 'Sedang diproses', cls: 'bg-blue-100 text-blue-800' },
  dikirim: { teks: 'Dikirim', cls: 'bg-purple-100 text-purple-800' },
  diterima: { teks: 'Diterima', cls: 'bg-green-100 text-green-800' },
  selesai: { teks: 'Selesai, dana cair', cls: 'bg-green-100 text-green-800' },
  dibatalkan: { teks: 'Dibatalkan (komplain)', cls: 'bg-neutral-200 text-neutral-600' },
};

export default async function PesananMasukPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; ok?: string; error?: string }>;
}) {
  const { tab = 'dibayar', ok, error: errMsg } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: tokoData } = await supabase.from('toko').select('id').eq('penjual_id', user.id);
  const tokoIds = ((tokoData ?? []) as { id: string }[]).map((t) => t.id);

  if (tokoIds.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-6">
        <p className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600">
          Kamu belum punya toko.{' '}
          <Link href="/toko-saya" className="font-semibold underline">
            Buat toko dulu
          </Link>
        </p>
      </div>
    );
  }

  const { data: pData, error } = await supabase
    .from('pesanan')
    .select('id, pembeli_id, status, subtotal, alamat_pengiriman, created_at')
    .in('toko_id', tokoIds)
    .in('status', ['dibayar', 'diproses', 'dikirim', 'diterima', 'selesai', 'dibatalkan'])
    .order('created_at', { ascending: false })
    .limit(200);
  const mentah = (pData ?? []) as Pesanan[];

  const semuaIds = mentah.map((p) => p.id);
  const { data: kData } = semuaIds.length
    ? await supabase.from('komplain').select('pesanan_id, status, alasan, putusan_catatan').in('pesanan_id', semuaIds)
    : { data: [] as Komplain[] };
  const komplainMap = new Map(((kData ?? []) as Komplain[]).map((k) => [k.pesanan_id, k]));

  // Pesanan dibatalkan hanya ditampilkan kalau penyebabnya komplain
  const semua = mentah.filter((p) => p.status !== 'dibatalkan' || komplainMap.has(p.id));

  const hitung = (...st: string[]) => semua.filter((p) => st.includes(p.status)).length;
  const tabs = [
    { key: 'dibayar', label: 'Perlu diproses', n: hitung('dibayar'), cocok: ['dibayar'] },
    { key: 'diproses', label: 'Diproses', n: hitung('diproses'), cocok: ['diproses'] },
    { key: 'dikirim', label: 'Dikirim', n: hitung('dikirim'), cocok: ['dikirim'] },
    {
      key: 'selesai',
      label: 'Selesai',
      n: hitung('diterima', 'selesai', 'dibatalkan'),
      cocok: ['diterima', 'selesai', 'dibatalkan'],
    },
    { key: 'semua', label: 'Semua', n: semua.length, cocok: [] as string[] },
  ];
  const aktif = tabs.find((t) => t.key === tab) ?? tabs[0];
  const pesanan = aktif.key === 'semua' ? semua : semua.filter((p) => aktif.cocok.includes(p.status));

  const ids = pesanan.map((p) => p.id);
  const pembeliIds = Array.from(new Set(pesanan.map((p) => p.pembeli_id)));
  const [{ data: iData }, { data: profs }] = await Promise.all([
    ids.length
      ? supabase.from('pesanan_item').select('id, pesanan_id, nama_produk, jumlah').in('pesanan_id', ids)
      : Promise.resolve({ data: [] as PItem[] }),
    pembeliIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', pembeliIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);
  const items = (iData ?? []) as PItem[];
  const namaPembeli = new Map(
    ((profs ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name ?? 'Pembeli'])
  );

  return (
    <div className="mx-auto max-w-xl px-4 pb-6 pt-6">
      <Link href="/toko-saya" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Toko saya
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold">Pesanan masuk</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Dana ditahan platform dan cair ke saldomu setelah pembeli mengonfirmasi barang diterima, atau otomatis 3 hari
        setelah dikirim jika tidak ada komplain.
      </p>

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

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/toko-saya/pesanan-masuk?tab=${t.key}`}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm ${
              aktif.key === t.key
                ? 'bg-ink-900 text-white'
                : 'border border-neutral-200 bg-white text-neutral-700'
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 text-xs font-semibold ${
                aktif.key === t.key ? 'bg-white/20' : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {t.n}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {pesanan.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            Tidak ada pesanan di tab ini.
          </div>
        )}

        {pesanan.map((p) => {
          const st = STATUS[p.status] ?? { teks: p.status, cls: 'bg-neutral-100 text-neutral-700' };
          const barang = items.filter((i) => i.pesanan_id === p.id);
          const kmp = komplainMap.get(p.id);

          return (
            <div key={p.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{namaPembeli.get(p.pembeli_id) ?? 'Pembeli'}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>{st.teks}</span>
              </div>

              <div className="mt-2 space-y-1">
                {barang.map((i) => (
                  <div key={i.id} className="text-sm text-neutral-600">
                    {i.nama_produk} x {i.jumlah}
                  </div>
                ))}
              </div>

              {p.alamat_pengiriman && (
                <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-neutral-50 p-2.5 text-xs text-neutral-600">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-pre-wrap">{p.alamat_pengiriman}</span>
                </p>
              )}

              {kmp?.status === 'terbuka' && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <div className="font-semibold">Pembeli mengajukan komplain</div>
                  <p className="mt-1 whitespace-pre-wrap">{kmp.alasan}</p>
                  <p className="mt-1">Dana ditahan sampai admin memutuskan. Kamu bisa menghubungi pembeli lewat chat.</p>
                </div>
              )}
              {kmp?.status === 'refund' && (
                <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
                  <div className="font-semibold">Komplain disetujui admin, dana dikembalikan ke pembeli</div>
                  {kmp.putusan_catatan && <p className="mt-1">Catatan admin: {kmp.putusan_catatan}</p>}
                </div>
              )}
              {kmp?.status === 'dicairkan' && (
                <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-900">
                  <div className="font-semibold">Komplain ditolak admin, dana diteruskan ke saldomu</div>
                  {kmp.putusan_catatan && <p className="mt-1">Catatan admin: {kmp.putusan_catatan}</p>}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
                <div>
                  <div className="font-bold">{rupiah(p.subtotal)}</div>
                  <div className="text-xs text-neutral-400">{waktuRelatif(p.created_at)}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ChatButton
                    lawanId={p.pembeli_id}
                    label="Pesanan masuk"
                    href="/marketplace/pesanan"
                    teks="Chat pembeli"
                    kecil
                  />
                  {p.status === 'dibayar' && (
                    <form action={statusPesananPenjual.bind(null, p.id, 'diproses')}>
                      <button className="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                        Proses pesanan
                      </button>
                    </form>
                  )}
                  {p.status === 'diproses' && (
                    <form action={statusPesananPenjual.bind(null, p.id, 'dikirim')}>
                      <button className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                        Tandai dikirim
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}