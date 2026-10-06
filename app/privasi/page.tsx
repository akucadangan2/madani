import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout from '@/components/legal-layout'

export const metadata: Metadata = { title: 'Kebijakan Privasi | MADANI' }

export default function Page() {
  return (
    <LegalLayout judul="Kebijakan Privasi" diperbarui="6 Oktober 2026">
      <p>
        Kebijakan ini menjelaskan bagaimana PT RHG Teknologi Indonesia (“kami”) selaku pengendali data
        pribadi mengumpulkan, menggunakan, dan melindungi data pribadi kamu saat memakai MADANI, baik
        melalui situs maupun aplikasi. Kami memproses data sesuai Undang-Undang No. 27 Tahun 2022 tentang
        Pelindungan Data Pribadi.
      </p>

      <h2>1. Data yang kami kumpulkan</h2>
      <ul>
        <li><b>Akun:</b> nama dan nomor WhatsApp. Kamu masuk memakai kode OTP yang dikirim lewat WhatsApp.</li>
        <li><b>Verifikasi identitas (opsional, wajib untuk fitur tertentu):</b> nomor KTP, foto KTP, dan foto selfie.</li>
        <li><b>Transaksi:</b> pesanan, keranjang, alamat pengiriman, lamaran dan pekerjaan, ulasan, saldo, dan riwayat penarikan dana.</li>
        <li><b>Konten buatan kamu:</b> nama dan foto toko atau produk, deskripsi, serta pesan chat dengan pengguna lain.</li>
        <li><b>Data teknis:</b> token notifikasi perangkat, alamat IP, dan catatan percobaan OTP untuk keamanan akun.</li>
        <li><b>Wilayah:</b> kecamatan yang kamu pilih. Aplikasi tidak meminta akses lokasi GPS.</li>
      </ul>

      <h2>2. Untuk apa data dipakai</h2>
      <ul>
        <li>Membuat dan mengamankan akun, serta mengirim OTP.</li>
        <li>Menjalankan transaksi: mempertemukan pembeli, penjual, pemberi kerja, dan pencari kerja, termasuk penahanan dana (escrow) dan pencairan.</li>
        <li>Verifikasi identitas untuk mencegah penipuan.</li>
        <li>Mengirim notifikasi tentang pesanan, pesan, lamaran, dan pembaruan akun.</li>
        <li>Menangani komplain, laporan pelanggaran, dan permintaan bantuan.</li>
        <li>Memenuhi kewajiban hukum dan menjaga keamanan layanan.</li>
      </ul>

      <h2>3. Dasar pemrosesan</h2>
      <p>
        Persetujuan kamu, pelaksanaan perjanjian dengan kamu (transaksi di MADANI), kewajiban hukum, dan
        kepentingan yang sah untuk mencegah penipuan dan menjaga keamanan.
      </p>

      <h2>4. Dengan siapa data dibagikan</h2>
      <ul>
        <li><b>Pengguna lain:</b> nama, nama toko, konten produk atau pekerjaan, ulasan, dan pesan chat hanya kepada pihak yang terlibat atau sesuai tampilan publik.</li>
        <li><b>Penyedia layanan teknologi:</b> Supabase (basis data dan penyimpanan), Vercel (hosting situs), Fonnte (pengiriman OTP WhatsApp), dan Google Firebase Cloud Messaging (notifikasi).</li>
        <li><b>Penyedia pembayaran:</b> akan ditambahkan ketika pembayaran daring diaktifkan, dan kebijakan ini akan diperbarui.</li>
        <li><b>Pihak berwenang:</b> bila diwajibkan oleh hukum atau perintah yang sah.</li>
      </ul>
      <p>Kami tidak menjual data pribadi kamu.</p>

      <h2>5. Penyimpanan di luar negeri</h2>
      <p>
        Sebagian penyedia layanan kami menyimpan atau memproses data di luar Indonesia. Kami memilih
        penyedia yang menerapkan pelindungan data yang memadai.
      </p>

      <h2>6. Keamanan</h2>
      <p>
        Foto KTP dan selfie disimpan pada penyimpanan privat dengan akses terbatas dan hanya dilihat admin
        untuk verifikasi. Akses data diatur dengan kontrol per pengguna. Meski begitu, tidak ada sistem yang
        sepenuhnya bebas risiko; jaga kerahasiaan perangkat dan kode OTP kamu.
      </p>

      <h2>7. Berapa lama data disimpan</h2>
      <p>
        Data akun disimpan selama akun aktif. Setelah kamu menghapus akun, data pribadi seperti nama, nomor
        telepon, foto KTP dan selfie, token notifikasi, dan isi chat dihapus atau dianonimkan. Catatan
        transaksi, laporan, dan data lain yang wajib kami simpan menurut peraturan perundang-undangan
        disimpan tanpa identitas yang dapat mengenali kamu, selama diwajibkan.
      </p>

      <h2>8. Hak kamu</h2>
      <p>
        Kamu berhak mengakses, memperbaiki, meminta salinan, menarik persetujuan, dan meminta penghapusan
        data pribadi kamu. Nama dapat diubah di menu Akun. Untuk penghapusan akun, buka menu Akun lalu pilih
        Hapus akun saya di aplikasi, atau kunjungi halaman{' '}
        <Link href="/hapus-akun">Hapus Akun</Link>. Untuk hak lainnya, hubungi kami di bawah.
      </p>

      <h2>9. Anak-anak</h2>
      <p>MADANI ditujukan bagi pengguna berusia 18 tahun ke atas. Kami tidak dengan sengaja mengumpulkan data anak.</p>

      <h2>10. Perubahan kebijakan</h2>
      <p>Jika ada perubahan penting, kami akan memberi tahu lewat aplikasi atau situs. Tanggal pembaruan tertera di atas.</p>

      <h2>11. Hubungi kami</h2>
      <p>
        PT RHG Teknologi Indonesia<br />
        Menara The Plaza, Jl. M.H. Thamrin No.28-30, Menteng, Jakarta Pusat 10350<br />
        <a href="mailto:info@rhgteknologiindonesia.id">info@rhgteknologiindonesia.id</a>
      </p>
    </LegalLayout>
  )
}