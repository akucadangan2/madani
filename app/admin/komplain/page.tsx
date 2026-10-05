import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AlertTriangle, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hitung, rupiah, waktuRelatif } from '@/lib/admin/data';
import ActionButton from '../_components/ActionButton';
import StatusBadge from '../_components/StatusBadge';

type Row = {
  id: string;
  pesanan_id: string;
  status: string;
  alasan: string;
  putusan_catatan: string | null;
  created_at: string;
  diproses_at: string | null;
  subtotal: number | string;
  alamat: string | null;
  pembeli_nama: string;
  toko_nama: string;
  barang: string | null;
};

const LABEL: Record<string, string> = {
  terbuka: 'Menunggu keputusan',
  refund: 'Disetujui (refund ke pembeli)',
  dicairkan: 'Ditolak (dana ke penjual)',
  dicabut: 'Dicabut pembeli',
};

function balik(tab: string, kv: Record<string, string>) {
  const p = new URLSearchParams();
  if (tab) p.set('tab', tab);
  Object.entries(kv).forEach(([k, v]) => p.set(k, v));
  return `/admin/komplain?${p.toString()}`;
}

async function putuskan(formData: FormData): Promise<void> {
  'use server';
  const id = String(formData.get('id') ?? '');
  const putusan = String(formData.get('putusan') ?? '');
  const catatan = String(formData.get('catatan') ?? '').trim();
  const tab = String(formData.get('tab') ?? '');

  if (!id || !['refund', 'cairkan'].includes(putusan)) {
    redirect(balik(tab, { error: 'Data tidak valid' }));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('rpc_putuskan_komplain', {
    p_komplain_id: id,
    p_putusan: putusan,
    p_catatan: catatan || null,
  });
  if (error) redirect(balik(tab, { error: error.message }));

  revalidatePath('/admin', 'layout');
  redirect(
    balik(tab, {
      ok:
        putusan === 'refund'
          ? 'Komplain disetujui, dana dikembalikan ke pembeli'
          : 'Komplain ditolak, dana diteruskan ke penjual',
    })
  );
}

export default async function AdminKomplain({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'terbuka' } = await searchParams;
  const supabase = await createClient();

  const [{ data, error }, cTerbuka, cRefund, cCairkan] = await Promise.all([
    supabase.rpc('rpc_admin_daftar_komplain', { p_status: tab === 'semua' ? null : tab }),
    hitung(supabase, 'komplain', 'status', 'terbuka'),
    hitung(supabase, 'komplain', 'status', 'refund'),
    hitung(supabase, 'komplain', 'status', 'dicairkan'),
  ]);
  const rows = (data ?? []) as Row[];

  const tabs = [
    { key: 'terbuka', label: 'Menunggu', n: cTerbuka },
    { key: 'refund', label: 'Refund', n: cRefund },
    { key: 'dicairkan', label: 'Ditolak', n: cCairkan },
    { key: 'semua', label: 'Semua', n: 0 },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Komplain Pesanan</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Dana pesanan ditahan selama komplain terbuka. Pilih: kembalikan ke pembeli, atau teruskan ke penjual.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/komplain?tab=${t.key}`}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm ${
              tab === t.key
                ? 'bg-ink-900 text-white'
                : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {t.label}
            {t.key !== 'semua' && (
              <span
                className={`rounded-full px-1.5 text-xs font-semibold ${
                  tab === t.key ? 'bg-white/20' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {t.n}
              </span>
            )}
          </Link>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Gagal memuat: {error.message}
        </div>
      )}

      <div className="space-y-3">
        {rows.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            Tidak ada komplain pada tab ini.
          </div>
        )}

        {rows.map((r) => {
          const info = `${rupiah(r.subtotal)} (${r.toko_nama} / ${r.pembeli_nama})`;
          return (
            <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-neutral-900">{rupiah(r.subtotal)}</span>
                      <StatusBadge status={LABEL[r.status] ?? r.status} />
                    </div>
                    <div className="text-sm text-neutral-600">
                      Pembeli: {r.pembeli_nama} - Toko: {r.toko_nama}
                    </div>
                    {r.barang && <div className="mt-1 text-sm text-neutral-800">{r.barang}</div>}
                    {r.alamat && (
                      <div className="mt-1 flex items-start gap-1 text-xs text-neutral-500">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="whitespace-pre-wrap">{r.alamat}</span>
                      </div>
                    )}

                    <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
                      <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">Alasan pembeli</div>
                      <p className="mt-1 whitespace-pre-wrap">{r.alasan}</p>
                    </div>

                    {r.putusan_catatan && (
                      <p className="mt-2 text-sm text-neutral-700">Catatan admin: {r.putusan_catatan}</p>
                    )}
                    <div className="mt-2 text-xs text-neutral-400">
                      Diajukan {waktuRelatif(r.created_at)}
                      {r.diproses_at ? ` - diputuskan ${waktuRelatif(r.diproses_at)}` : ''}
                    </div>
                  </div>
                </div>

                {r.status === 'terbuka' && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <ActionButton
                      action={putuskan}
                      confirmText={`Refund ${info}? Dana dikembalikan ke saldo pembeli dan pesanan dibatalkan.`}
                      promptLabel="Catatan untuk pembeli dan penjual (boleh dikosongkan):"
                      fields={{ id: r.id, putusan: 'refund', tab }}
                    >
                      Refund ke pembeli
                    </ActionButton>
                    <ActionButton
                      action={putuskan}
                      variant="danger"
                      promptLabel="Tolak komplain dan teruskan dana ke penjual. Alasan (boleh dikosongkan):"
                      fields={{ id: r.id, putusan: 'cairkan', tab }}
                    >
                      Cairkan ke penjual
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