import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout from '@/components/legal-layout'

export const metadata: Metadata = { title: 'Kebijakan Privasi | MADANI' }

export default function Page() {
  return (
    <LegalLayout judul="Kebijakan Privasi" diperbarui="15 Oktober 2026">
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
        <li><b>Alamat tersimpan:</b> nama penerima, nomor telepon penerima, alamat, catatan alamat, dan titik lokasi di peta bila kamu memilihnya.</li>
        <li><b>Konten buatan kamu:</b> nama dan foto toko atau produk, deskripsi, serta pesan chat dengan pengguna lain.</li>
        <li><b>Data teknis:</b> token notifikasi perangkat, alamat IP, dan catatan percobaan OTP untuk keamanan akun.</li>
        <li>
          <b>Lokasi:</b> kecamatan yang kamu pilih. Di aplikasi, akses lokasi (GPS) hanya diminta saat kamu
          menekan tombol untuk memakai lokasi saat ini ketika mengisi alamat. Titik lokasi disimpan sebagai
          bagian dari alamat tersimpan milikmu dan disertakan pada pesanan sehingga penjual dapat mengantar
          barang. Kami tidak melacak lokasimu di latar belakang.
        </li>
      </ul>

      <h2>2. Untuk apa data dipakai</h2>
      <ul>
        <li>Membuat dan mengamankan akun, serta mengirim OTP.</li>
        <li>Menjalankan transaksi: mempertemukan pembeli, penjual, pemberi kerja, dan pencari kerja, termasuk penahanan dana (escrow) dan pencairan.</li>
        <li>Menyimpan alamat dan titik lokasi agar pengisian alamat pengiriman lebih cepat.</li>
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
        <li><b>Pengguna lain:</b> nama, nama toko, konten produk atau pekerjaan, ulasan, dan pesan chat hanya kepada pihak yang terlibat atau sesuai tampilan publik. Alamat pengiriman beserta titik lokasinya dibagikan kepada penjual yang memproses pesananmu.</li>
        <li><b>Penyedia layanan teknologi:</b> Supabase (basis data dan penyimpanan), Vercel (hosting situs), Fonnte (pengiriman OTP WhatsApp), Google Firebase Cloud Messaging (notifikasi), serta OpenStreetMap dan layanan geokode bawaan perangkat (tampilan peta dan penerjemahan titik lokasi menjadi alamat).</li>
        <li><b>Penyedia pembayaran:</b> DOKU, untuk memproses pembayaran daring. Yang kami kirim ke DOKU hanya nomor tagihan dan nominal. Data kartu, e-wallet, atau akun bank kamu dimasukkan langsung di halaman pembayaran DOKU dan tidak disimpan oleh kami.</li>
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
        telepon, alamat tersimpan, foto KTP dan selfie, token notifikasi, dan isi chat dihapus atau
        dianonimkan. Catatan transaksi, laporan, dan data lain yang wajib kami simpan menurut peraturan
        perundang-undangan disimpan tanpa identitas yang dapat mengenali kamu, selama diwajibkan.
      </p>
        <p>
          Foto KTP dan foto selfie dihapus dari penyimpanan secara otomatis setelah verifikasi identitas
          kamu disetujui. Setelah itu kami hanya menyimpan nomor KTP dan status verifikasi sebagai
          catatan bahwa verifikasi sudah dilakukan. Jika verifikasi ditolak, foto yang kamu kirim tetap
          disimpan sementara agar kamu dapat mengirim ulang.
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