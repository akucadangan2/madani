import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { simpanTarif, simpanDetailSkill, ubahPublikDokumen, hapusDokumen } from '@/lib/actions/pekerja-profil';
import DokumenForm from './dokumen-form';

export const dynamic = 'force-dynamic';

const SATUAN = ['jam', 'hari', 'minggu', 'bulan', 'pertemuan', 'paket'];
const JENIS: Record<string, string> = {
  sertifikat: 'Sertifikat',
  keahlian: 'Bukti keahlian',
  sim: 'SIM',
  lainnya: 'Lainnya',
};

type Dok = { id: string; jenis: string; judul: string; path: string; tampil_publik: boolean };

export default async function TarifDokumenPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error: errMsg } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data: prof } = await supabase.from('profiles').select('tarif, satuan_tarif, skills').eq('id', user.id).maybeSingle();
  const { data: dData } = await supabase
    .from('dokumen_pekerja')
    .select('id, jenis, judul, path, tampil_publik')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const dokumen = (dData ?? []) as Dok[];

  const skillSaya = (prof?.skills ?? []) as string[];
  const { data: dsData } = await supabase
    .from('pekerja_skill')
    .select('skill, pengalaman_tahun, tarif, satuan_tarif')
    .eq('user_id', user.id);
  const detail = new Map(
    ((dsData ?? []) as { skill: string; pengalaman_tahun: number | null; tarif: number | null; satuan_tarif: string | null }[]).map(
      (x) => [x.skill, x]
    )
  );

  const urlMap = new Map<string, string>();
  if (dokumen.length > 0) {
    const { data: signed } = await supabase.storage.from('dokumen-pekerja').createSignedUrls(
      dokumen.map((d) => d.path),
      600
    );
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) urlMap.set(s.path, s.signedUrl);
    }
  }

  const tarif = Number(prof?.tarif ?? 0);
  const satuan = (prof?.satuan_tarif as string | null) ?? 'hari';

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-6">
      <Link href="/profil/skill" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Profil & Skill
      </Link>
      <h1 className="mb-4 mt-3 font-display text-2xl font-bold">Tarif & dokumen</h1>

      {ok && <div className="mb-3 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">{ok}</div>}
      {errMsg && <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{errMsg}</div>}

      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold">Tarif kerja</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Tarif tampil di daftar Cari Pekerja sebagai patokan bagi pemberi kerja. Kosongkan bila tidak ingin menampilkan tarif.
        </p>
        <form action={simpanTarif} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Tarif (Rp)</label>
            <input
              name="tarif"
              inputMode="numeric"
              defaultValue={tarif > 0 ? String(tarif) : ''}
              placeholder="150000"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Per</label>
            <select name="satuan_tarif" defaultValue={satuan} className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm">
              {SATUAN.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600">Simpan</button>
        </form>
      </section>

      {skillSaya.length > 0 && (
        <section className="mt-7 rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="font-semibold">Pengalaman & tarif per keahlian</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Isi lama pengalaman dan tarif untuk tiap keahlian. Ini tampil di kartumu saat pemberi kerja mencari keahlian tersebut. Kosongkan bila tidak ingin menampilkan.
          </p>
          <form action={simpanDetailSkill} className="mt-3 space-y-3">
            {skillSaya.map((s) => {
              const d = detail.get(s);
              return (
                <div key={s} className="rounded-xl border border-neutral-100 p-3">
                  <input type="hidden" name="skill" value={s} />
                  <p className="text-sm font-semibold capitalize text-neutral-900">{s}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-600">Pengalaman (tahun)</label>
                      <input
                        name="tahun"
                        inputMode="numeric"
                        defaultValue={d?.pengalaman_tahun ?? ''}
                        placeholder="3"
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-600">Tarif (Rp)</label>
                      <input
                        name="tarif"
                        inputMode="numeric"
                        defaultValue={d?.tarif ? String(d.tarif) : ''}
                        placeholder="150000"
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-neutral-600">Per</label>
                      <select
                        name="satuan"
                        defaultValue={d?.satuan_tarif ?? 'hari'}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                      >
                        {SATUAN.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
            <button className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600">
              Simpan semua
            </button>
          </form>
        </section>
      )}

      <h2 className="mb-2 mt-7 font-semibold">Dokumen ({dokumen.length}/15)</h2>
      <p className="mb-3 text-sm text-neutral-500">
        Unggah sertifikat, bukti keahlian, atau SIM. Dokumen hanya terlihat orang lain bila kamu menyalakan &quot;Tampilkan ke pemberi kerja&quot;.
      </p>
      <DokumenForm userId={user.id} jumlah={dokumen.length} />

      <div className="mt-4 space-y-3">
        {dokumen.length === 0 && <p className="text-sm text-neutral-500">Belum ada dokumen.</p>}
        {dokumen.map((d) => {
          const url = urlMap.get(d.path);
          return (
            <div key={d.id} className="rounded-2xl border border-neutral-200 bg-white p-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">{d.judul}</p>
                  <p className="text-xs text-neutral-500">
                    {JENIS[d.jenis] ?? d.jenis} - {d.tampil_publik ? 'Terlihat pemberi kerja' : 'Hanya kamu'}
                  </p>
                  {url && (
                    <a href={url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary-600 hover:underline">
                      Buka berkas
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2 border-t border-neutral-100 pt-3">
                <form action={ubahPublikDokumen.bind(null, d.id, !d.tampil_publik)}>
                  <button className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                    {d.tampil_publik ? 'Sembunyikan' : 'Tampilkan ke pemberi kerja'}
                  </button>
                </form>
                <form action={hapusDokumen.bind(null, d.id)} className="ml-auto">
                  <button className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                    Hapus
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}