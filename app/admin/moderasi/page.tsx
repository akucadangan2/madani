import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { tindakLaporan } from '@/lib/actions/moderasi'

export const dynamic = 'force-dynamic'

type Laporan = {
  id: string
  jenis: string
  target_id: string
  target_user_id: string | null
  pelapor_id: string | null
  alasan: string
  detail: string | null
  status: string
  catatan_admin: string | null
  created_at: string
}

export default async function ModerasiPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; tampil?: string }>
}) {
  const sp = await searchParams
  const selesai = sp.tampil === 'selesai'
  const admin = createAdminClient()

  let q = admin.from('laporan_konten').select('*').order('created_at', { ascending: false }).limit(100)
  q = selesai ? q.neq('status', 'baru') : q.eq('status', 'baru')
  const { data } = await q
  const daftar = (data ?? []) as Laporan[]

  const idUser = new Set<string>()
  for (const l of daftar) {
    if (l.pelapor_id) idUser.add(l.pelapor_id)
    if (l.target_user_id) idUser.add(l.target_user_id)
  }
  const idBy = (j: string) => daftar.filter((l) => l.jenis === j).map((l) => l.target_id)

  const [prof, pr, tk, ts] = await Promise.all([
    admin.from('profiles').select('id, full_name, phone').in('id', [...idUser]),
    admin.from('produk').select('id, nama').in('id', idBy('produk')),
    admin.from('toko').select('id, nama_toko').in('id', idBy('toko')),
    admin.from('tasks').select('id, judul').in('id', idBy('task')),
  ])

  const orang = new Map<string, string>()
  for (const p of prof.data ?? []) orang.set(p.id, `${p.full_name ?? '-'} (${p.phone ?? '-'})`)
  const target = new Map<string, string>()
  for (const r of pr.data ?? []) target.set(r.id, r.nama)
  for (const r of tk.data ?? []) target.set(r.id, r.nama_toko)
  for (const r of ts.data ?? []) target.set(r.id, r.judul)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Moderasi laporan</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/moderasi" className={!selesai ? 'font-bold underline' : ''}>Baru</Link>
          <Link href="/admin/moderasi?tampil=selesai" className={selesai ? 'font-bold underline' : ''}>Selesai</Link>
        </div>
      </div>

      {sp.ok && <p className="rounded-lg bg-emerald-50 p-3 text-emerald-800">{sp.ok}</p>}
      {sp.error && <p className="rounded-lg bg-red-50 p-3 text-red-800">{sp.error}</p>}
      {daftar.length === 0 && <p className="text-slate-500">Tidak ada laporan.</p>}

      {daftar.map((l) => (
        <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold uppercase">{l.jenis}</span>
            <span className="font-bold">{target.get(l.target_id) ?? l.target_id}</span>
            <span className="text-slate-500">{new Date(l.created_at).toLocaleString('id-ID')}</span>
            {l.status !== 'baru' && <span className="rounded-full bg-amber-100 px-2 py-0.5">{l.status}</span>}
          </div>
          <p className="mt-2"><b>Alasan:</b> {l.alasan}</p>
          {l.detail && <p className="text-slate-600">{l.detail}</p>}
          <p className="mt-1 text-sm text-slate-500">
            Pelapor: {l.pelapor_id ? orang.get(l.pelapor_id) ?? '-' : '-'} · Pemilik konten:{' '}
            {l.target_user_id ? orang.get(l.target_user_id) ?? '-' : '-'}
          </p>
          {l.catatan_admin && <p className="mt-1 text-sm">Catatan: {l.catatan_admin}</p>}

          {l.status === 'baru' && (
            <form action={tindakLaporan} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={l.id} />
              <input
                name="catatan"
                placeholder="Catatan (opsional)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {l.jenis !== 'pengguna' && (
                  <button name="aksi" value="tindak" className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white">
                    Nonaktifkan konten
                  </button>
                )}
                <button name="aksi" value="blokir" className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">
                  Blokir akun pelanggar
                </button>
                <button name="aksi" value="tolak" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold">
                  Tolak laporan
                </button>
              </div>
            </form>
          )}
        </div>
      ))}
    </div>
  )
}