import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout from '@/components/legal-layout'

export const metadata: Metadata = { title: 'Hubungi Kami | MADANI' }

export default function Page() {
  return (
    <LegalLayout judul="Hubungi Kami">
      <p>Ada pertanyaan, kendala, atau laporan penyalahgunaan? Tim kami siap membantu.</p>

      <h2>PT RHG Teknologi Indonesia</h2>
      <p>
        Email: <a href="mailto:info@rhgteknologiindonesia.id">info@rhgteknologiindonesia.id</a><br />
        Alamat: Menara The Plaza, Jl. M.H. Thamrin No.28-30, Menteng, Jakarta Pusat 10350
      </p>

      <h2>Melaporkan konten atau pengguna</h2>
      <p>
        Di aplikasi, buka halaman produk, toko, pekerjaan, atau chat, lalu ketuk menu titik tiga dan pilih
        Laporkan. Laporan ditinjau paling lambat 24 jam. Untuk kasus mendesak, kirim email dengan subjek
        LAPORAN.
      </p>

      <h2>Hapus akun dan data pribadi</h2>
      <p>
        Lihat halaman <Link href="/hapus-akun">Hapus Akun</Link>, atau baca{' '}
        <Link href="/privasi">Kebijakan Privasi</Link>.
      </p>
    </LegalLayout>
  )
}