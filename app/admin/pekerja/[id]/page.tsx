import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { ambilAdmin } from '@/lib/auth/admin-guard';
import { blokirPengguna, bukaBlokirPengguna } from '@/lib/actions/admin-pekerja';
import ActionButton from '../../_components/ActionButton';
import StatusBadge from '../../_components/StatusBadge';

export const dynamic = 'force-dynamic';

const rupiah = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(n) || 0);
const tgl = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

type Task = { id: string; judul: string; upah: number; satuan_upah: string | null; status: string; created_at: string };
type Rating = { rating: number; komentar: string | null; created_at: string };

export default async function KelolaPekerja({ params }: { params: Promise<{ id: string }> }) {
  if (!(await ambilAdmin())) redirect('/beranda');
  const { id } = await params;
  const db = createAdminClient();

  const { data: p } = await db
    .from('profiles')
    .select('id, full_name, phone, skills, tarif, satuan_tarif, kecamatan_id, terakhir_aktif, created_at')
    .eq('id', id)
    .maybeSingle();
  if (!p) notFound();

  const [
    { data: kec },
    { data: ktp },
    { data: roles },
    { data: saldoRow },
    { data: taskList },
    { data: ratingList },
    { data: blokir },
    { data: dokumen },
    { data: tarik },
    { data: au },
  ] = await Promise.all([
    p.kecamatan_id
      ? db.from('kecamatan').select('nama, kabupaten').eq('id', p.kecamatan_id).maybeSingle()
      : Promise.resolve({ data: null }),
    db.from('verifikasi_ktp').select('nomor_ktp, status, created_at, diverifikasi_at').eq('user_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('user_roles').select('role').eq('user_id', id),
    db.from('v_saldo_user').select('saldo').eq('user_id', id).maybeSingle(),
    db.from('tasks').select('id, judul, upah, satuan_upah, status, created_at').eq('worker_terpilih_id', id).order('created_at', { ascending: false }).limit(200),
    db.from('rating_kerja').select('rating, komentar, created_at').eq('ke_user_id', id).order('created_at', { ascending: false }).limit(50),
    db.from('pengguna_blokir').select('alasan, dibuat_at').eq('user_id', id).maybeSingle(),
    db.from('dokumen_pekerja').select('jenis, judul, tampil_publik').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
    db.from('penarikan_dana').select('jumlah, status, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(5),
    db.auth.admin.getUserById(id),
  ]);

  const tasks = (taskList ?? []) as Task[];
  const selesai = tasks.filter((t) => t.status === 'selesai');
  const totalUpah = selesai.reduce((a, t) => a + Number(t.upah || 0), 0);
  const ratings = (ratingList ?? []) as Rating[];
  const rata = ratings.length ? ratings.reduce((a, r) => a + Number(r.rating), 0) / ratings.length : null;
  const authUser = au?.user;
  const peran = ((roles ?? []) as { role: string }[]).map((r) => r.role);
  const adaAdmin = peran.includes('admin');
  const skills = (p.skills ?? []) as string[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pekerja" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800">
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar pekerja
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-neutral-900">{p.full_name ?? '(tanpa nama)'}</h1>
          {blokir && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Diblokir</span>}
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          {p.phone ?? authUser?.phone ?? '-'} · Kec. {kec?.nama ?? '-'}
          {kec?.kabupaten ? `, ${kec.kabupaten}` : ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { l: 'Saldo', v: rupiah(Number(saldoRow?.saldo ?? 0)) },
          { l: 'Tugas selesai', v: String(selesai.length) },
          { l: 'Total upah tugas selesai', v: rupiah(totalUpah) },
          { l: 'Rating', v: rata ? `${rata.toFixed(1)} (${ratings.length})` : '-' },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-xs text-neutral-500">{k.l}</div>
            <div className="mt-1 text-lg font-semibold text-neutral-900">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-neutral-900">Identitas</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Status KTP</dt>
              <dd>{ktp ? <StatusBadge status={ktp.status} /> : <span className="text-neutral-400">Belum mengajukan</span>}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Nomor KTP</dt>
              <dd className="font-mono text-neutral-900">{ktp?.nomor_ktp ?? '-'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Diajukan</dt>
              <dd className="text-neutral-900">{tgl(ktp?.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Email</dt>
              <dd className="text-neutral-900">{authUser?.email ?? '-'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Terdaftar</dt>
              <dd className="text-neutral-900">{tgl(p.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Login terakhir</dt>
              <dd className="text-neutral-900">{tgl(authUser?.last_sign_in_at)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Peran</dt>
              <dd className="text-neutral-900">{peran.join(', ') || '-'}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-neutral-400">
            Foto KTP dan swafoto ada di menu <Link href="/admin/verifikasi-ktp" className="underline">Verifikasi KTP</Link>.
          </p>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-neutral-900">Keahlian dan tarif</h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.length === 0 && <span className="text-sm text-neutral-400">Belum memilih keahlian</span>}
            {skills.map((s) => (
              <span key={s} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700">
                {s}
              </span>
            ))}
          </div>
          <div className="mt-3 text-sm text-neutral-700">
            Tarif: {p.tarif ? `${rupiah(Number(p.tarif))}${p.satuan_tarif ? ` / ${p.satuan_tarif}` : ''}` : '-'}
          </div>
          {(dokumen ?? []).length > 0 && (
            <div className="mt-4">
              <div className="mb-1 text-xs font-semibold uppercase text-neutral-400">Dokumen</div>
              <ul className="space-y-1 text-sm text-neutral-700">
                {(dokumen as { jenis: string; judul: string; tampil_publik: boolean }[]).map((d, i) => (
                  <li key={i}>
                    {d.judul} <span className="text-xs text-neutral-400">({d.jenis}{d.tampil_publik ? ', publik' : ''})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-neutral-900">Pekerjaan terbaru</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-neutral-500">Belum pernah dipilih untuk pekerjaan.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 text-sm">
            {tasks.slice(0, 10).map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 py-2">
                <span className="font-medium text-neutral-900">{t.judul}</span>
                <span className="text-neutral-500">
                  {rupiah(Number(t.upah))}
                  {t.satuan_upah ? ` / ${t.satuan_upah}` : ''}
                </span>
                <span className="ml-auto text-xs text-neutral-500">{t.status} · {tgl(t.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-neutral-900">Ulasan</h2>
          {ratings.length === 0 ? (
            <p className="text-sm text-neutral-500">Belum ada ulasan.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {ratings.slice(0, 8).map((r, i) => (
                <li key={i}>
                  <span className="font-medium text-neutral-900">{r.rating} / 5</span>
                  <span className="ml-2 text-xs text-neutral-400">{tgl(r.created_at)}</span>
                  {r.komentar && <div className="text-neutral-600">{r.komentar}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-neutral-900">Penarikan dana terakhir</h2>
          {(tarik ?? []).length === 0 ? (
            <p className="text-sm text-neutral-500">Belum pernah menarik dana.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {(tarik as { jumlah: number; status: string; created_at: string }[]).map((t, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-neutral-900">{rupiah(Number(t.jumlah))}</span>
                  <span className="text-neutral-500">{t.status} · {tgl(t.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-neutral-900">Status akun</h2>
        {blokir ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Akun ini diblokir sejak {tgl(blokir.dibuat_at)}. Alasan: {blokir.alasan ?? '-'}
            </div>
            <ActionButton action={bukaBlokirPengguna} confirmText="Buka blokir akun ini?" fields={{ id }}>
              Buka blokir
            </ActionButton>
          </div>
        ) : adaAdmin ? (
          <p className="text-sm text-neutral-500">Akun ini admin, jadi tidak bisa diblokir dari sini.</p>
        ) : (
          <form action={blokirPengguna} className="space-y-2">
            <input type="hidden" name="id" value={id} />
            <label className="block text-sm text-neutral-600">
              Alasan pemblokiran
              <textarea
                name="alasan"
                required
                minLength={3}
                maxLength={300}
                rows={2}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white">Blokir akun</button>
            <p className="text-xs text-neutral-400">
              Pengguna tidak bisa login lagi. Sesi yang sedang berjalan berakhir paling lambat sekitar satu jam.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}