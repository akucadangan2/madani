import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { KTP } from '@/lib/admin/konstanta';
import { hitung, waktuRelatif } from '@/lib/admin/data';
import ActionButton from '../_components/ActionButton';
import StatusBadge from '../_components/StatusBadge';

type KtpRow = {
  id: string;
  user_id: string;
  nomor_ktp: string | null;
  foto_ktp_url: string | null;
  foto_selfie_url: string | null;
  status: string;
  created_at: string;
};

function balik(tab: string, kv: Record<string, string>) {
  const p = new URLSearchParams();
  if (tab) p.set('tab', tab);
  Object.entries(kv).forEach(([k, v]) => p.set(k, v));
  return `/admin/verifikasi-ktp?${p.toString()}`;
}

async function ubahStatus(formData: FormData): Promise<void> {
  'use server';
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const nama = String(formData.get('nama') ?? 'Pengguna');
  const tab = String(formData.get('tab') ?? '');

  if (!id || ![KTP.SETUJU, KTP.TOLAK].some((s) => s === status)) {
    redirect(balik(tab, { error: 'Data tidak valid' }));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('verifikasi_ktp')
    .update({
      status,
      diverifikasi_oleh: user.id,
      diverifikasi_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) redirect(balik(tab, { error: error.message }));

  revalidatePath('/admin', 'layout');
  redirect(
    balik(tab, {
      ok: status === KTP.SETUJU ? `KTP ${nama} diverifikasi` : `KTP ${nama} ditolak`,
    })
  );
}

export default async function AdminVerifikasiKtp({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = KTP.MENUNGGU } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('verifikasi_ktp')
    .select('id, user_id, nomor_ktp, foto_ktp_url, foto_selfie_url, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (tab !== 'semua') query = query.eq('status', tab);

  const [{ data, error }, cMenunggu, cSetuju, cTolak] = await Promise.all([
    query,
    hitung(supabase, 'verifikasi_ktp', 'status', KTP.MENUNGGU),
    hitung(supabase, 'verifikasi_ktp', 'status', KTP.SETUJU),
    hitung(supabase, 'verifikasi_ktp', 'status', KTP.TOLAK),
  ]);

  const rows = (data ?? []) as KtpRow[];

  // Foto disimpan sebagai path di bucket privat; buat link sementara (15 menit)
  const paths = rows
    .flatMap((r) => [r.foto_ktp_url, r.foto_selfie_url])
    .filter((p): p is string => !!p && !p.startsWith('http'));
  const { data: signed } = paths.length
    ? await supabase.storage.from('ktp').createSignedUrls(paths, 900)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlMap = new Map<string, string>();
  for (const s of signed ?? []) {
    if (s.path && s.signedUrl) urlMap.set(s.path, s.signedUrl);
  }
  const urlDari = (p: string | null): string | null =>
    !p ? null : p.startsWith('http') ? p : urlMap.get(p) ?? null;

  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profs } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nama = new Map(
    ((profs ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name ?? '-'])
  );

  const tabs = [
    { key: KTP.MENUNGGU as string, label: 'Menunggu', n: cMenunggu },
    { key: KTP.SETUJU as string, label: 'Disetujui', n: cSetuju },
    { key: KTP.TOLAK as string, label: 'Ditolak', n: cTolak },
    { key: 'semua', label: 'Semua', n: cMenunggu + cSetuju + cTolak },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Verifikasi KTP</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Cocokkan NIK, foto KTP, dan selfie sebelum menyetujui.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/verifikasi-ktp?tab=${t.key}`}
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
            Tidak ada pengajuan pada tab ini.
          </div>
        )}

        {rows.map((k) => {
          const namaUser = nama.get(k.user_id) ?? '-';
          const urlKtp = urlDari(k.foto_ktp_url);
          const urlSelfie = urlDari(k.foto_selfie_url);

          return (
            <div key={k.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-neutral-900">{namaUser}</span>
                        <StatusBadge status={k.status} />
                      </div>
                      <div className="mt-0.5 font-mono text-sm text-neutral-600">NIK {k.nomor_ktp ?? '-'}</div>
                      <div className="mt-0.5 text-xs text-neutral-400">Diajukan {waktuRelatif(k.created_at)}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3">
                    {[
                      { label: 'Foto KTP', url: urlKtp },
                      { label: 'Selfie + KTP', url: urlSelfie },
                    ].map((f) => (
                      <div key={f.label}>
                        <div className="mb-1 text-xs font-medium text-neutral-500">{f.label}</div>
                        {f.url ? (
                          <a href={f.url} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={f.url}
                              alt={f.label}
                              className="h-32 w-48 rounded-xl border border-neutral-200 object-cover hover:opacity-90"
                            />
                          </a>
                        ) : (
                          <div className="flex h-32 w-48 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-xs text-neutral-400">
                            Foto tidak tersedia
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  {k.status !== KTP.SETUJU && (
                    <ActionButton
                      action={ubahStatus}
                      confirmText={`Verifikasi KTP ${namaUser}? Pastikan foto KTP, selfie, dan NIK sudah dicek.`}
                      fields={{ id: k.id, status: KTP.SETUJU, nama: namaUser, tab }}
                    >
                      Verifikasi
                    </ActionButton>
                  )}
                  {k.status !== KTP.TOLAK && (
                    <ActionButton
                      action={ubahStatus}
                      variant="danger"
                      confirmText={`Tolak KTP ${namaUser}?`}
                      fields={{ id: k.id, status: KTP.TOLAK, nama: namaUser, tab }}
                    >
                      Tolak
                    </ActionButton>
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