'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const kembali = (kunci: 'ok' | 'error', pesan: string) =>
  redirect(`/admin/moderasi?${kunci}=${encodeURIComponent(pesan)}`)

export async function tindakLaporan(formData: FormData) {
  const sb = await createClient()
  const { data } = await sb.auth.getUser()
  if (!data.user) redirect('/login')

  const admin = createAdminClient()
  const { data: peran } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .limit(1)
  if (!peran?.length) kembali('error', 'Hanya admin yang boleh menindak laporan.')

  const id = String(formData.get('id') ?? '')
  const aksi = String(formData.get('aksi') ?? '')
  const catatan = String(formData.get('catatan') ?? '').trim() || null

  const { data: l } = await admin.from('laporan_konten').select('*').eq('id', id).single()
  if (!l) kembali('error', 'Laporan tidak ditemukan.')

  let status = 'ditolak'

  if (aksi === 'tindak') {
    status = 'ditindak'
    if (l.jenis === 'produk') {
      await admin.from('produk').update({ status: 'nonaktif' }).eq('id', l.target_id)
    } else if (l.jenis === 'toko') {
      await admin.from('toko').update({ status_verifikasi: 'ditolak' }).eq('id', l.target_id)
    } else if (l.jenis === 'task') {
      await admin.from('tasks').update({ status: 'dibatalkan' }).eq('id', l.target_id).eq('status', 'terbuka')
    }
  } else if (aksi === 'blokir') {
    status = 'ditindak'
    if (!l.target_user_id) kembali('error', 'Pengguna target tidak diketahui.')
    const { error } = await admin.auth.admin.updateUserById(l.target_user_id, { ban_duration: '876000h' })
    if (error) kembali('error', error.message)
  } else if (aksi !== 'tolak') {
    kembali('error', 'Aksi tidak dikenal.')
  }

  await admin
    .from('laporan_konten')
    .update({ status, catatan_admin: catatan, ditangani_at: new Date().toISOString() })
    .eq('id', id)

  kembali('ok', 'Laporan diperbarui.')
}