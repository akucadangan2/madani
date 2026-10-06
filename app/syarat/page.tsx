import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout from '@/components/legal-layout'

export const metadata: Metadata = { title: 'Syarat dan Ketentuan | MADANI' }

export default function Page() {
  return (
    <LegalLayout judul="Syarat dan Ketentuan" diperbarui="6 Oktober 2026">
      <p>
        Dengan membuat akun atau memakai MADANI, kamu menyetujui syarat ini. MADANI dikelola oleh PT RHG
        Teknologi Indonesia (“kami”). Baca juga <Link href="/privasi">Kebijakan Privasi</Link>.
      </p>

      <h2>1. Tentang MADANI</h2>
      <p>
        MADANI adalah platform perantara yang mempertemukan warga satu kecamatan untuk jual beli barang dan
        pekerjaan ringan. Kami bukan pihak dalam perjanjian antara pembeli dan penjual, atau antara pemberi
        dan pencari kerja, dan tidak menjadi pemberi kerja bagi pencari kerja.
      </p>

      <h2>2. Akun</h2>
      <ul>
        <li>Kamu harus berusia minimal 18 tahun dan memberikan data yang benar.</li>
        <li>Masuk memakai nomor WhatsApp dan kode OTP. Jangan membagikan kode OTP kepada siapa pun.</li>
        <li>Kamu bertanggung jawab atas semua aktivitas di akunmu.</li>
        <li>Fitur tertentu, seperti melamar kerja, membayar, atau menarik dana, memerlukan verifikasi KTP.</li>
      </ul>

      <h2>3. Transaksi dan dana</h2>
      <ul>
        <li>Dana transaksi ditahan (escrow) dan baru diteruskan kepada penjual atau pekerja setelah pesanan diterima atau pekerjaan diselesaikan sesuai ketentuan di aplikasi.</li>
        <li>Biaya layanan dan pembagian hasil ditampilkan di aplikasi sebelum kamu menyetujui transaksi.</li>
        <li>Penarikan dana diproses setelah verifikasi dan dapat ditolak bila ada indikasi pelanggaran atau penipuan.</li>
        <li>Penjual wajib mengirim barang sesuai deskripsi. Pemberi kerja wajib membayar upah sesuai kesepakatan.</li>
      </ul>

      <h2>4. Konten dan perilaku yang dilarang</h2>
      <p>Kamu dilarang mengunggah atau melakukan hal berikut:</p>
      <ul>
        <li>Barang atau jasa ilegal atau berbahaya, termasuk narkotika, senjata, barang curian, dan konten dewasa.</li>
        <li>Penipuan, informasi palsu, atau penyalahgunaan identitas orang lain.</li>
        <li>Pelecehan, ancaman, ujaran kebencian, atau konten yang merendahkan pihak lain.</li>
        <li>Spam, manipulasi ulasan, dan upaya mengalihkan transaksi untuk menghindari escrow.</li>
        <li>Mengganggu atau meretas sistem MADANI.</li>
      </ul>

      <h2>5. Laporan, pemblokiran, dan moderasi</h2>
      <p>
        Pengguna dapat melaporkan produk, toko, pekerjaan, atau pengguna lain lewat tombol Laporkan, dan
        dapat memblokir pengguna lain. Kami meninjau laporan paling lambat 24 jam. Konten yang melanggar
        akan dihapus atau dinonaktifkan, dan akun pelanggar dapat ditangguhkan atau ditutup tanpa
        pemberitahuan terlebih dahulu.
      </p>

      <h2>6. Komplain</h2>
      <p>
        Jika ada masalah pada pesanan atau pekerjaan, ajukan komplain lewat aplikasi. Kami dapat menahan
        dana, mengembalikan dana (refund), atau mencairkannya kepada penerima berdasarkan hasil peninjauan.
      </p>

      <h2>7. Batas tanggung jawab</h2>
      <p>
        Selama diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung, kualitas barang
        atau pekerjaan yang dibuat pengguna lain, maupun gangguan layanan di luar kendali kami. Tanggung
        jawab kami terbatas pada nilai transaksi yang bersangkutan.
      </p>

      <h2>8. Penutupan akun</h2>
      <p>
        Kamu dapat menghapus akun kapan saja lewat aplikasi atau halaman <Link href="/hapus-akun">Hapus Akun</Link>,
        selama tidak ada pesanan atau pekerjaan yang sedang berjalan dan saldo sudah ditarik.
        Kami dapat menangguhkan atau menutup akun yang melanggar syarat ini.
      </p>

      <h2>9. Perubahan syarat</h2>
      <p>Kami dapat memperbarui syarat ini. Dengan terus memakai MADANI setelah pembaruan, kamu dianggap menyetujuinya.</p>

      <h2>10. Hukum yang berlaku</h2>
      <p>
        Syarat ini tunduk pada hukum Republik Indonesia. Sengketa diupayakan diselesaikan secara musyawarah,
        dan bila tidak tercapai diselesaikan di Pengadilan Negeri Jakarta Pusat.
      </p>

      <h2>11. Kontak</h2>
      <p>
        <a href="mailto:info@rhgteknologiindonesia.id">info@rhgteknologiindonesia.id</a> · Menara The Plaza,
        Jl. M.H. Thamrin No.28-30, Menteng, Jakarta Pusat 10350
      </p>
    </LegalLayout>
  )
}