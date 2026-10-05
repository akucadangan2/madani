import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AlertTriangle, Banknote } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PENARIKAN } from '@/lib/admin/konstanta';
import { hitung, rupiah, waktuRelatif } from '@/lib/admin/data';
import ActionButton from '../_components/ActionButton';
import StatusBadge from '../_components/StatusBadge';

type Row = {
  id: string;
  user_id: string;
  jumlah: number | string;
  status: string;
  bank_nama: string | null;
  bank_rekening: string | null;
  bank_atas_nama: string | null;
  diproses_at: string | null;
  catatan_admin: string | null;
  created_at: string;
};

type LedRow = { user_id: string; tipe: string; jumlah: number | string };

function balik(tab: string, kv: Record<string, string>) {
  const p = new URLSearchParams();
  if (tab) p.set('tab', tab);
  Object.entries(kv).forEach(([k, v]) => p.set(k, v));
  return `/admin/pencairan-dana?${p.toString()}`;
}

// Setujui / tolak lewat fungsi database (yang mengurus ledger dan status)
async function proses(formData: FormData): Promise<void> {
  'use server';
  const id = String(formData.get('id') ?? '');
  const setuju = String(formData.get('setuju') ?? '') === '1';
  const catatan = String(formData.get('catatan') ?? '').trim();
  const info = String(formData.get('info') ?? 'Pencairan');
  const tab = String(formData.get('tab') ?? '');

  if (!id) redirect(balik(tab, { error: 'Data tidak valid' }));

  const supabase = await createClient();
  const { error } = await supabase.rpc('rpc_proses_pencairan', {
    p_penarikan_id: id,
    p_approve: setuju,
    p_catatan: catatan || null,
  });
  if (error) redirect(balik(tab, { error: error.message }));

  revalidatePath('/admin', 'layout');
  redirect(
    balik(tab, {
      ok: setuju ? `${info} disetujui, saldo user sudah dipotong` : `${info} ditolak`,
    })
  );
}

export default async function AdminPencairan({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = PENARIKAN.MENUNGGU } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('penarikan_dana')
    .select(
      'id, user_id, jumlah, status, bank_nama, bank_rekening, bank_atas_nama, diproses_at, catatan_admin, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (tab !== 'semua') query = query.eq('status', tab);

  const [{ data, error }, cMenunggu, cSelesai, cTolak] = await Promise.all([
    query,
    hitung(supabase, 'penarikan_dana', 'status', PENARIKAN.MENUNGGU),
    hitung(supabase, 'penarikan_dana', 'status', PENARIKAN.SELESAI),
    hitung(supabase, 'penarikan_dana', 'status', PENARIKAN.TOLAK),
  ]);

  const rows = (data ?? []) as Row[];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

  const [{ data: profs }, { data: ledData }] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    userIds.length
      ? supabase.from('ledger_entries').select('user_id, tipe, jumlah').in('user_id', userIds)
      : Promise.resolve({ data: [] as LedRow[] }),
  ]);

  const nama = new Map(
    ((profs ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name ?? '-'])
  );

  const saldoUser = new Map<string, number>();
  for (const l of (ledData ?? []) as LedRow[]) {
    const v = l.tipe === 'kredit' ? Number(l.jumlah) : -Number(l.jumlah);
    saldoUser.set(l.user_id, (saldoUser.get(l.user_id) ?? 0) + v);
  }

  const tabs = [
    { key: PENARIKAN.MENUNGGU as string, label: 'Menunggu', n: cMenunggu },
    { key: PENARIKAN.SELESAI as string, label: 'Selesai', n: cSelesai },
    { key: PENARIKAN.TOLAK as string, label: 'Ditolak', n: cTolak },
    { key: 'semua', label: 'Semua', n: cMenunggu + cSelesai + cTolak },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Pencairan Dana</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Transfer manual ke rekening pemohon, lalu klik Setujui. Saldo user baru dipotong saat disetujui.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/pencairan-dana?tab=${t.key}`}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm ${
              tab === t.key
                ? 'bg-ink-900 text-white'
                : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 text-xs font-semibold ${
                tab === t.key ? 'bg-white/20' : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {t.n}
            </span>
          </Link>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Gagal memuat: {error.message}
        </div>
      )}

      <div className="space-y-3">
        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            Tidak ada permintaan pada tab ini.
          </div>
        )}

        {rows.map((r) => {
          const namaUser = nama.get(r.user_id) ?? '-';
          const jumlahTeks = rupiah(r.jumlah);
          const info = `${jumlahTeks} untuk ${namaUser}`;
          const saldo = saldoUser.get(r.user_id) ?? 0;
          const kurang = r.status === PENARIKAN.MENUNGGU && saldo < Number(r.jumlah);

          return (
            <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    <Banknote className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-neutral-900">{jumlahTeks}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="text-sm text-neutral-600">
                      {namaUser} · saldo saat ini {rupiah(saldo)}
                    </div>

                    {kurang && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Saldo user kurang dari jumlah pengajuan. Sebaiknya ditolak.
                      </div>
                    )}

                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                      <dt className="text-neutral-500">Bank</dt>
                      <dd className="font-medium text-neutral-800">{r.bank_nama ?? '-'}</dd>
                      <dt className="text-neutral-500">No. rekening</dt>
                      <dd className="font-mono font-medium text-neutral-800">{r.bank_rekening ?? '-'}</dd>
                      <dt className="text-neutral-500">Atas nama</dt>
                      <dd className="font-medium text-neutral-800">{r.bank_atas_nama ?? '-'}</dd>
                      {r.catatan_admin && (
                        <>
                          <dt className="text-neutral-500">Catatan</dt>
                          <dd className="text-neutral-800">{r.catatan_admin}</dd>
                        </>
                      )}
                      {r.diproses_at && (
                        <>
                          <dt className="text-neutral-500">Diproses</dt>
                          <dd className="text-neutral-800">{new Date(r.diproses_at).toLocaleString('id-ID')}</dd>
                        </>
                      )}
                    </dl>

                    <div className="mt-2 text-xs text-neutral-400">Diajukan {waktuRelatif(r.created_at)}</div>
                  </div>
                </div>

                {r.status === PENARIKAN.MENUNGGU && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <ActionButton
                      action={proses}
                      confirmText={`Setujui ${info}?\n\nPastikan kamu SUDAH mentransfer ke ${r.bank_nama ?? ''} ${r.bank_rekening ?? ''} a.n. ${r.bank_atas_nama ?? ''}. Saldo user akan langsung dipotong.`}
                      fields={{ id: r.id, setuju: '1', info, tab }}
                    >
                      Setujui
                    </ActionButton>
                    <ActionButton
                      action={proses}
                      variant="danger"
                      promptLabel={`Tolak ${info}. Alasan penolakan (boleh dikosongkan):`}
                      fields={{ id: r.id, setuju: '0', info, tab }}
                    >
                      Tolak
                    </ActionButton>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}