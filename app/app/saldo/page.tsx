import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ambilSaldo } from '@/lib/saldo';
import { rupiah, waktuRelatif } from '@/lib/admin/data';

type Ledger = {
  id: string;
  tipe: string;
  jumlah: number | string;
  keterangan: string | null;
  created_at: string;
};

type Tarik = {
  id: string;
  jumlah: number | string;
  status: string;
  bank_nama: string | null;
  catatan_admin: string | null;
  created_at: string;
};

const LABEL_TARIK: Record<string, { teks: string; cls: string }> = {
  menunggu: { teks: 'Menunggu admin', cls: 'bg-amber-100 text-amber-800' },
  selesai: { teks: 'Berhasil dikirim', cls: 'bg-green-100 text-green-800' },
  ditolak: { teks: 'Ditolak', cls: 'bg-red-100 text-red-700' },
  disetujui: { teks: 'Disetujui', cls: 'bg-green-100 text-green-800' },
};

export default async function SaldoPage({
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

  const [{ saldo, diproses, tersedia }, { data: ledgerData }, { data: tarikData }] = await Promise.all([
    ambilSaldo(supabase, user.id),
    supabase
      .from('ledger_entries')
      .select('id, tipe, jumlah, keterangan, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('penarikan_dana')
      .select('id, jumlah, status, bank_nama, catatan_admin, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const ledger = (ledgerData ?? []) as Ledger[];
  const tarik = (tarikData ?? []) as Tarik[];

  return (
    <div className="mx-auto max-w-xl">
      {/* Header saldo */}
      <div className="on-dark bg-ink-900 px-5 pb-8 pt-10 text-white">
        <p className="text-sm text-white/60">Saldo kamu</p>
        <p className="mt-1 font-display text-4xl font-bold text-white">{rupiah(saldo)}</p>
        {diproses > 0 && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
            <Clock className="h-3.5 w-3.5" />
            {rupiah(diproses)} sedang diproses untuk penarikan
          </p>
        )}
        <Link
          href="/saldo/tarik"
          className="mt-5 inline-flex rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-ink-900 hover:opacity-90"
        >
          Tarik dana
        </Link>
      </div>

      <div className="mt-4 space-y-5 px-4">
        {ok && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
            {ok}
          </div>
        )}
        {errMsg && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {errMsg}
          </div>
        )}

        {/* Pengajuan penarikan */}
        {tarik.length > 0 && (
          <section>
            <h2 className="mb-2 font-semibold">Pengajuan penarikan</h2>
            <div className="space-y-2">
              {tarik.map((t) => {
                const lb = LABEL_TARIK[t.status] ?? { teks: t.status, cls: 'bg-neutral-100 text-neutral-700' };
                return (
                  <div key={t.id} className="rounded-2xl border border-neutral-200 bg-white p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-neutral-900">{rupiah(t.jumlah)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${lb.cls}`}>{lb.teks}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      ke {t.bank_nama ?? '-'} · {waktuRelatif(t.created_at)}
                    </div>
                    {t.catatan_admin && (
                      <div className="mt-1.5 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-600">
                        Catatan admin: {t.catatan_admin}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Riwayat saldo */}
        <section>
          <h2 className="mb-2 font-semibold">Riwayat saldo</h2>
          <div className="space-y-2">
            {ledger.length === 0 && (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                Belum ada riwayat. Saldo masuk setelah pekerjaan atau pesanan selesai.
              </div>
            )}
            {ledger.map((r) => {
              const masuk = r.tipe === 'kredit';
              const Icon = masuk ? ArrowDownLeft : ArrowUpRight;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      masuk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">{r.keterangan ?? '-'}</p>
                    <p className="text-xs text-neutral-400">{waktuRelatif(r.created_at)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${masuk ? 'text-green-700' : 'text-red-600'}`}>
                    {masuk ? '+' : '-'} {rupiah(r.jumlah)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}