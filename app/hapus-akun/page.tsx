import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout from '@/components/legal-layout'
import { createClient } from '@/lib/supabase/server'
import HapusAkunForm from './hapus-form'

export const metadata: Metadata = { title: 'Hapus Akun | MADANI' }
export const dynamic = 'force-dynamic'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ selesai?: string }>
}) {
  const sp = await searchParams
  const sb = await createClient()
  const { data } = await sb.auth.getUser()
  const user = data.user

  return (
    <LegalLayout judul="Hapus Akun">
      {sp.selesai === '1' && !user && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          Akunmu sudah dihapus. Terima kasih pernah memakai MADANI.
        </div>
      )}

      <p>
        Kamu bisa menghapus akun MADANI kapan saja. Di aplikasi: Akun, lalu Hapus akun saya. Atau lewat
        halaman ini.
      </p>

      <h2>Yang terjadi saat akun dihapus</h2>
      <ul>
        <li>Nama dan nomor telepon dihapus dari profil, dan kamu keluar dari semua perangkat.</li>
        <li>Foto KTP, selfie, dan data verifikasi dihapus.</li>
        <li>Token notifikasi dan isi chat yang kamu kirim dihapus.</li>
        <li>Toko dan produk dinonaktifkan, pekerjaan dan pesanan yang belum dibayar dibatalkan.</li>
        <li>Catatan transaksi yang wajib disimpan menurut hukum tetap ada tanpa identitasmu.</li>
        <li>Penghapusan tidak bisa dibatalkan.</li>
      </ul>

      <h2>Syarat</h2>
      <ul>
        <li>Tidak ada pesanan atau pekerjaan yang sedang berjalan, dan tidak ada komplain terbuka.</li>
        <li>Saldo sudah ditarik (saldo harus Rp0) dan tidak ada penarikan yang diproses.</li>
      </ul>

      {user ? (
        <HapusAkunForm />
      ) : (
        <div className="rounded-xl border border-slate-200 p-4">
          <p>
            Masuk dulu untuk menghapus akunmu dari halaman ini.{' '}
            <Link href="/login">Masuk ke MADANI</Link>, lalu kembali ke halaman ini.
          </p>
          <p className="mt-2">
            Tidak bisa masuk? Kirim permintaan dari nomor terdaftar ke{' '}
            <a href="mailto:info@rhgteknologiindonesia.id">info@rhgteknologiindonesia.id</a> dengan subjek
            HAPUS AKUN. Kami proses paling lambat 7 hari kerja.
          </p>
        </div>
      )}
    </LegalLayout>
  )
}