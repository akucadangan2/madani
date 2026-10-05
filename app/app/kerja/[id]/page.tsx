import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Check, ChevronLeft, Lock, MapPin, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { lamarKerja, terimaLamaran, bayarTask, selesaikanTask } from '@/lib/actions/kerja';
import { rupiah, waktuRelatif } from '@/lib/admin/data';
import RatingKerja from './rating-kerja';
import ChatButton from '@/app/app/chat/_components/chat-button';

export const dynamic = 'force-dynamic';

type Task = {
  id: string;
  pemberi_kerja_id: string;
  kecamatan_id: string | null;
  kategori_id: string | null;
  judul: string;
  deskripsi: string | null;
  upah: number | string;
  status: string;
  worker_terpilih_id: string | null;
  created_at: string;
};

type Lamaran = {
  id: string;
  pencari_kerja_id: string;
  status: string;
  created_at: string;
};

type RatingRow = {
  dari_user_id: string;
  ke_user_id: string;
  rating: number;
  komentar: string | null;
};

const btnPrimary =
  'inline-flex items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90';
const btnGreen =
  'inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700';

export default async function KerjaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ok, error: errMsg } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: taskData } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();
  if (!taskData) notFound();
  const task = taskData as Task;

  const isPemilik = user.id === task.pemberi_kerja_id;
  const isWorker = user.id === task.worker_terpilih_id;

  const [{ data: kat }, { data: kec }, { data: lamData }, { data: trxData }, { data: ratingData }] =
    await Promise.all([
      task.kategori_id
        ? supabase.from('kategori').select('nama').eq('id', task.kategori_id).maybeSingle()
        : Promise.resolve({ data: null as { nama: string } | null }),
      task.kecamatan_id
        ? supabase.from('kecamatan').select('nama').eq('id', task.kecamatan_id).maybeSingle()
        : Promise.resolve({ data: null as { nama: string } | null }),
      // RLS: pemilik melihat semua pelamar, pelamar hanya melihat lamarannya sendiri
      supabase
        .from('lamaran_kerja')
        .select('id, pencari_kerja_id, status, created_at')
        .eq('task_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('transaksi')
        .select('id, status')
        .eq('referensi_id', id)
        .eq('tipe', 'kerja')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('rating_kerja')
        .select('dari_user_id, ke_user_id, rating, komentar')
        .eq('task_id', id),
    ]);

  const lamaran = (lamData ?? []) as Lamaran[];
  const trx = trxData as { id: string; status: string } | null;
  const lamaranSaya = lamaran.find((l) => l.pencari_kerja_id === user.id) ?? null;
  const ratingTask = (ratingData ?? []) as RatingRow[];

  // Reputasi pelamar (rata-rata rating yang pernah diterima), hanya untuk pemilik
  const idsPelamar = Array.from(new Set(lamaran.map((l) => l.pencari_kerja_id)));
  const { data: repData } =
    isPemilik && idsPelamar.length > 0
      ? await supabase.from('rating_kerja').select('ke_user_id, rating').in('ke_user_id', idsPelamar)
      : { data: [] as { ke_user_id: string; rating: number }[] };
  const reputasi = new Map<string, { total: number; n: number }>();
  for (const r of (repData ?? []) as { ke_user_id: string; rating: number }[]) {
    const cur = reputasi.get(r.ke_user_id) ?? { total: 0, n: 0 };
    cur.total += r.rating;
    cur.n += 1;
    reputasi.set(r.ke_user_id, cur);
  }

  const idsNama = Array.from(
    new Set(
      [...lamaran.map((l) => l.pencari_kerja_id), task.pemberi_kerja_id, task.worker_terpilih_id].filter(
        (x): x is string => !!x && x !== user.id
      )
    )
  );
  const { data: profs } = idsNama.length
    ? await supabase.from('profiles').select('id, full_name').in('id', idsNama)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nama = new Map(
    ((profs ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name ?? 'Pengguna'])
  );

  const dibayar = trx?.status === 'held' || trx?.status === 'released';
  const langkah = task.status === 'selesai' ? 4 : dibayar ? 3 : task.status === 'proses' ? 2 : 1;
  const batal = task.status === 'dibatalkan';

  const LANGKAH = ['Dibuka', 'Pekerja dipilih', 'Dana ditahan', 'Selesai'];

  const lawanId = isPemilik ? task.worker_terpilih_id : isWorker ? task.pemberi_kerja_id : null;
  const diberi = ratingTask.find((r) => r.dari_user_id === user.id) ?? null;
  const diterima = ratingTask.find((r) => r.ke_user_id === user.id) ?? null;

  return (
    <div className="mx-auto max-w-xl px-4 pb-6 pt-6">
      <Link href="/kerja" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Semua pekerjaan
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold leading-tight">{task.judul}</h1>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
        {kat?.nama && <span>{kat.nama}</span>}
        {kec?.nama && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {kec.nama}
          </span>
        )}
        <span>{waktuRelatif(task.created_at)}</span>
      </div>

      <div className="mt-4 text-3xl font-bold text-secondary-700">{rupiah(task.upah)}</div>

      {ok && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          {ok}
        </div>
      )}
      {errMsg && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {errMsg}
        </div>
      )}

      {/* Langkah */}
      {batal ? (
        <div className="mt-5 rounded-2xl bg-neutral-100 p-3 text-sm text-neutral-600">Pekerjaan ini dibatalkan.</div>
      ) : (
        <ol className="mt-5 grid grid-cols-4 gap-1.5">
          {LANGKAH.map((l, i) => {
            const nomor = i + 1;
            const sudah = langkah >= nomor;
            return (
              <li key={l} className="text-center">
                <div
                  className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    sudah ? 'bg-green-600 text-white' : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {sudah && langkah > nomor ? <Check className="h-4 w-4" /> : nomor}
                </div>
                <div className={`mt-1 text-[11px] leading-tight ${sudah ? 'text-neutral-900' : 'text-neutral-400'}`}>
                  {l}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-5 whitespace-pre-wrap text-neutral-700">{task.deskripsi}</p>

      <div className="mt-6 space-y-4">
        {/* ===== PEMBERI KERJA ===== */}
        {isPemilik && task.status === 'terbuka' && (
          <section className="rounded-2xl border border-neutral-200 bg-white p-4">
            <h2 className="font-semibold">Pelamar ({lamaran.length})</h2>
            <div className="mt-3 space-y-2">
              {lamaran.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-500">Belum ada yang melamar.</p>
              )}
              {lamaran.map((l) => {
                const rep = reputasi.get(l.pencari_kerja_id);
                return (
                  <div
                    key={l.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 p-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-neutral-900">
                        {nama.get(l.pencari_kerja_id) ?? 'Pelamar'}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                        {rep ? (
                          <span className="inline-flex items-center gap-0.5 font-medium text-amber-700">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {(rep.total / rep.n).toFixed(1)} ({rep.n})
                          </span>
                        ) : (
                          <span>Belum ada rating</span>
                        )}
                        <span>- {l.status}</span>
                        <span>- {waktuRelatif(l.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <ChatButton
                        lawanId={l.pencari_kerja_id}
                        label={task.judul}
                        href={`/kerja/${task.id}`}
                        teks="Chat"
                        kecil
                      />
                      {l.status === 'menunggu' && (
                        <form action={terimaLamaran.bind(null, l.id, task.id)}>
                          <button className={btnGreen}>Terima</button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {isPemilik && task.status === 'proses' && (
          <section className="rounded-2xl border border-neutral-200 bg-white p-4">
            <h2 className="font-semibold">Pekerja terpilih</h2>
            <p className="mt-1 text-sm text-neutral-700">
              {task.worker_terpilih_id ? nama.get(task.worker_terpilih_id) ?? 'Pekerja' : '-'}
            </p>

            {!dibayar ? (
              <>
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Dana ditahan platform dan baru dicairkan ke pekerja setelah kamu menyatakan pekerjaan selesai.
                    <strong> Mode uji coba:</strong> pembayaran disimulasikan, belum ada uang sungguhan yang bergerak.
                  </span>
                </div>
                <form action={bayarTask.bind(null, task.id)} className="mt-3">
                  <button className={btnPrimary}>Bayar {rupiah(task.upah)} &amp; tahan dana</button>
                </form>
              </>
            ) : (
              <>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-800">
                  <Lock className="h-4 w-4" /> Dana {rupiah(task.upah)} sedang ditahan.
                </div>
                <form action={selesaikanTask.bind(null, task.id)} className="mt-3">
                  <button className={btnGreen}>Pekerjaan selesai, cairkan dana</button>
                </form>
                <p className="mt-2 text-xs text-neutral-500">
                  Klik hanya setelah pekerjaan benar-benar selesai. Pencairan tidak bisa dibatalkan.
                </p>
              </>
            )}
          </section>
        )}

        {/* ===== PEKERJA TERPILIH ===== */}
        {isWorker && task.status === 'proses' && (
          <section className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <div className="font-semibold">Kamu terpilih untuk pekerjaan ini</div>
            <p className="mt-1">
              {dibayar
                ? `Dana ${rupiah(task.upah)} sudah ditahan. Kerjakan, lalu pemberi kerja akan mengonfirmasi dan dana masuk ke saldomu.`
                : 'Menunggu pemberi kerja membayar dan menahan dana. Mulai bekerja setelah dana ditahan.'}
            </p>
          </section>
        )}

        {/* ===== PELAMAR / PENGUNJUNG ===== */}
        {!isPemilik && !isWorker && task.status === 'terbuka' && !lamaranSaya && (
          <form action={lamarKerja.bind(null, task.id)}>
            <button className={`${btnPrimary} w-full py-3.5`}>Lamar pekerjaan ini</button>
          </form>
        )}

        {!isPemilik && lamaranSaya && task.status === 'terbuka' && (
          <div className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-700">
            Kamu sudah melamar ({lamaranSaya.status}). Tunggu konfirmasi dari{' '}
            {nama.get(task.pemberi_kerja_id) ?? 'pemberi kerja'}.
          </div>
        )}

        {!isPemilik && !isWorker && task.status !== 'terbuka' && !batal && (
          <div className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600">
            Pekerjaan ini sudah tidak membuka lamaran.
          </div>
        )}

        {!isPemilik && (
          <ChatButton
            lawanId={task.pemberi_kerja_id}
            label={task.judul}
            href={`/kerja/${task.id}`}
            teks="Chat pemberi kerja"
          />
        )}
        {isPemilik && task.worker_terpilih_id && (
          <ChatButton
            lawanId={task.worker_terpilih_id}
            label={task.judul}
            href={`/kerja/${task.id}`}
            teks="Chat pekerja"
          />
        )}

        {/* ===== SELESAI ===== */}
        {task.status === 'selesai' && (
          <section className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <div className="font-semibold">Pekerjaan selesai</div>
            <p className="mt-1">
              {isWorker ? (
                <>
                  Upahmu sudah masuk ke saldo.{' '}
                  <Link href="/saldo" className="font-semibold underline">
                    Lihat saldo
                  </Link>
                </>
              ) : (
                'Dana sudah dicairkan ke pekerja.'
              )}
            </p>
          </section>
        )}

        {task.status === 'selesai' && lawanId && (
          <RatingKerja
            taskId={task.id}
            lawanNama={nama.get(lawanId) ?? 'lawan kerjamu'}
            diberi={diberi ? { rating: diberi.rating, komentar: diberi.komentar } : null}
            diterima={diterima ? { rating: diterima.rating, komentar: diterima.komentar } : null}
          />
        )}
      </div>
    </div>
  );
}