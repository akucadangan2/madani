import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Search, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TOKO } from '@/lib/admin/konstanta';
import { hitung, waktuRelatif } from '@/lib/admin/data';
import ActionButton from '../_components/ActionButton';
import StatusBadge from '../_components/StatusBadge';

type TokoRow = {
  id: string;
  penjual_id: string;
  kecamatan_id: string | null;
  nama_toko: string;
  deskripsi: string | null;
  status_verifikasi: string;
  created_at: string;
};

function balik(tab: string, q: string, kv: Record<string, string>) {
  const p = new URLSearchParams();
  if (tab) p.set('tab', tab);
  if (q) p.set('q', q);
  Object.entries(kv).forEach(([k, v]) => p.set(k, v));
  return `/admin/toko?${p.toString()}`;
}

async function ubahStatus(formData: FormData): Promise<void> {
  'use server';
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const nama = String(formData.get('nama') ?? 'Toko');
  const tab = String(formData.get('tab') ?? '');
  const q = String(formData.get('q') ?? '');

  if (!id || !(Object.values(TOKO) as string[]).includes(status)) {
    redirect(balik(tab, q, { error: 'Data tidak valid' }));
  }

  const supabase = await createClient();
  const { error } = await supabase.from('toko').update({ status_verifikasi: status }).eq('id', id);
  if (error) {
    redirect(balik(tab, q, { error: error.message }));
  }

  revalidatePath('/admin', 'layout');
  redirect(
    balik(tab, q, {
      ok: status === TOKO.SETUJU ? `Toko "${nama}" disetujui` : `Toko "${nama}" ditolak`,
    })
  );
}

export default async function AdminToko({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab = TOKO.MENUNGGU, q = '' } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('toko')
    .select('id, penjual_id, kecamatan_id, nama_toko, deskripsi, status_verifikasi, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (tab !== 'semua') query = query.eq('status_verifikasi', tab);
  if (q) query = query.ilike('nama_toko', `%${q}%`);

  const [{ data, error }, cMenunggu, cSetuju, cTolak] = await Promise.all([
    query,
    hitung(supabase, 'toko', 'status_verifikasi', TOKO.MENUNGGU),
    hitung(supabase, 'toko', 'status_verifikasi', TOKO.SETUJU),
    hitung(supabase, 'toko', 'status_verifikasi', TOKO.TOLAK),
  ]);

  const rows = (data ?? []) as TokoRow[];

  const penjualIds = Array.from(new Set(rows.map((r) => r.penjual_id)));
  const kecIds = Array.from(new Set(rows.map((r) => r.kecamatan_id).filter((x): x is string => !!x)));

  const [{ data: profs }, { data: kecs }] = await Promise.all([
    penjualIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', penjualIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    kecIds.length
      ? supabase.from('kecamatan').select('id, nama').in('id', kecIds)
      : Promise.resolve({ data: [] as { id: string; nama: string }[] }),
  ]);

  const namaPenjual = new Map(
    ((profs ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name ?? '-'])
  );
  const namaKec = new Map(((kecs ?? []) as { id: string; nama: string }[]).map((k) => [k.id, k.nama]));

  const tabs = [
    { key: TOKO.MENUNGGU as string, label: 'Menunggu', n: cMenunggu },
    { key: TOKO.SETUJU as string, label: 'Disetujui', n: cSetuju },
    { key: TOKO.TOLAK as string, label: 'Ditolak', n: cTolak },
    { key: 'semua', label: 'Semua', n: cMenunggu + cSetuju + cTolak },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Verifikasi Toko</h1>
        <p className="mt-1 text-sm text-neutral-600">Setujui atau tolak toko yang baru mendaftar.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/admin/toko?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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

        <form action="/admin/toko" className="relative">
          <input type="hidden" name="tab" value={tab} />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nama toko..."
            className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-neutral-400 sm:w-64"
          />
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Gagal memuat: {error.message}
        </div>
      )}

      <div className="space-y-3">
        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            {q ? `Tidak ada toko dengan nama "${q}".` : 'Tidak ada toko pada tab ini.'}
          </div>
        )}

        {rows.map((t) => (
          <div key={t.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
                  <Store className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-neutral-900">{t.nama_toko}</span>
                    <StatusBadge status={t.status_verifikasi} />
                  </div>
                  <div className="mt-0.5 text-sm text-neutral-600">
                    {namaPenjual.get(t.penjual_id) ?? '-'} · Kec.{' '}
                    {t.kecamatan_id ? namaKec.get(t.kecamatan_id) ?? '-' : '-'}
                  </div>
                  {t.deskripsi && <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{t.deskripsi}</p>}
                  <div className="mt-1 text-xs text-neutral-400">Daftar {waktuRelatif(t.created_at)}</div>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                {t.status_verifikasi !== TOKO.SETUJU && (
                  <ActionButton
                    action={ubahStatus}
                    fields={{ id: t.id, status: TOKO.SETUJU, nama: t.nama_toko, tab, q }}
                  >
                    Setujui
                  </ActionButton>
                )}
                {t.status_verifikasi !== TOKO.TOLAK && (
                  <ActionButton
                    action={ubahStatus}
                    variant="danger"
                    confirmText={`Tolak toko "${t.nama_toko}"?`}
                    fields={{ id: t.id, status: TOKO.TOLAK, nama: t.nama_toko, tab, q }}
                  >
                    Tolak
                  </ActionButton>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}