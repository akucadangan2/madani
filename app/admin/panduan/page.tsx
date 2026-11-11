import Link from 'next/link';
import type { ReactNode } from 'react';

function Bagian({ nomor, judul, children }: { nomor: number; judul: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="flex items-center gap-3 font-display text-lg font-bold text-neutral-900">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm text-white">
          {nomor}
        </span>
        {judul}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}

function Langkah({ item }: { item: ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-1.5 pl-5">
      {item.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ol>
  );
}

export default function PanduanKeuangan() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Panduan Keuangan</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Cara kerja uang di MADANI, proses penarikan saldo oleh admin, dan pembagian hasil ke kecamatan/mitra.
        </p>
      </div>

      <Bagian nomor={1} judul="Gambaran alur uang">
        <p>
          Semua pembayaran pengguna (belanja, pekerjaan, dan isi saldo) masuk ke akun DOKU milik MADANI. Dana
          tersebut tidak otomatis keluar ke rekening pengguna. Saldo yang tampil di aplikasi adalah catatan di
          sistem MADANI, bukan uang yang berada di akun DOKU pengguna.
        </p>
        <p>
          Karena itu penarikan saldo tidak berjalan otomatis. Pengguna mengajukan penarikan, admin menyetujui,
          lalu tim MADANI mentransfer secara berkala. Estimasi dana sampai ke rekening pengguna paling lama 2 hari
          kerja setelah disetujui.
        </p>
      </Bagian>

      <Bagian nomor={2} judul="Dari pembayaran sampai saldo pekerja atau penjual">
        <Langkah
          item={[
            'Pembeli atau pemberi kerja membayar lewat DOKU. Dana berstatus ditahan (held) di sistem.',
            'Setelah pesanan diterima atau pekerjaan selesai, dana dicairkan ke saldo penjual atau pekerja sebesar persentase pekerja/penjual.',
            'Sisa dana dibagi untuk MADANI (provider) dan kecamatan. Bagian ini tidak masuk saldo pengguna manapun dan tetap berada di akun DOKU.',
          ]}
        />
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-500">
              <tr>
                <th className="px-3 py-2">Pihak</th>
                <th className="px-3 py-2">Bagian standar</th>
                <th className="px-3 py-2">Ke mana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <tr>
                <td className="px-3 py-2">Pekerja atau penjual</td>
                <td className="px-3 py-2">90%</td>
                <td className="px-3 py-2">Saldo di aplikasi, ditarik lewat Pencairan Dana</td>
              </tr>
              <tr>
                <td className="px-3 py-2">MADANI (provider)</td>
                <td className="px-3 py-2">7%</td>
                <td className="px-3 py-2">Tetap di akun DOKU</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Kecamatan/mitra</td>
                <td className="px-3 py-2">3%</td>
                <td className="px-3 py-2">Dibayarkan admin per bulan lewat Setoran Kecamatan</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Persentase dapat berbeda per kecamatan dan diatur di menu <Link href="/admin/bagi-hasil" className="font-medium text-secondary-700 hover:underline">Bagi Hasil</Link>.
          Total ketiga persentase harus 100%.
        </p>
      </Bagian>

      <Bagian nomor={3} judul="Isi saldo (top up)">
        <p>
          Pengguna memilih jumlah di menu Saldo lalu membayar lewat DOKU. Setelah DOKU mengirim konfirmasi
          pembayaran, saldo bertambah otomatis dengan keterangan Isi saldo. Admin tidak perlu melakukan apa pun.
        </p>
      </Bagian>

      <Bagian nomor={4} judul="Memproses penarikan saldo (harian atau sesuai jadwal)">
        <p>
          Buka menu <Link href="/admin/pencairan-dana" className="font-medium text-secondary-700 hover:underline">Pencairan Dana</Link>.
          Permintaan melewati empat status: Menunggu, Antrean transfer, Selesai, atau Ditolak.
        </p>
        <Langkah
          item={[
            <>Buka tab <b>Menunggu</b>. Periksa nama bank, nomor rekening, atas nama, dan saldo pengguna. Peringatan merah berarti saldo kurang dari jumlah pengajuan.</>,
            <>Centang permintaan yang valid (atau klik <b>Pilih semua di halaman</b>) lalu klik <b>Setujui terpilih</b>. Saldo pengguna langsung dipotong dan permintaan pindah ke tab <b>Antrean transfer</b>. Pengguna menerima notifikasi bahwa dana ditransfer paling lama 2 hari kerja. Untuk data yang tidak sesuai, centang lalu klik <b>Tolak terpilih</b> (isi alasan lebih dulu); saldo tidak berubah.</>,
            <>Pada jadwal transfer, buka tab <b>Antrean transfer</b> lalu klik <b>Unduh CSV</b>. File berisi bank, nomor rekening, atas nama, dan jumlah. Saat dibuka di Excel, ubah format kolom nomor rekening menjadi Text agar angka nol di depan tidak hilang.</>,
            'Lakukan transfer dari rekening yang dipakai tim keuangan MADANI, berdasarkan daftar di CSV. Bila bank menyediakan transfer massal, daftar ini dapat dipakai sebagai bahan unggahan.',
            <>Setelah transfer berhasil, centang permintaan yang sudah dikirim (atau klik <b>Pilih semua</b>), isi nomor referensi atau catatan transfer, lalu klik <b>Tandai sudah ditransfer</b>. Status menjadi Selesai dan pengguna menerima notifikasi.</>,
          ]}
        />
        <p>
          Jika transfer gagal, misalnya nomor rekening salah, centang permintaan tersebut lalu klik <b>Batalkan terpilih</b> di Antrean
          transfer. Saldo pengguna dikembalikan dan alasan dicatat. Minta pengguna memperbaiki data rekening
          lalu mengajukan ulang.
        </p>
      </Bagian>

      <Bagian nomor={5} judul="Membayar bagian kecamatan/mitra (bulanan)">
        <Langkah
          item={[
            <>Buka menu <Link href="/admin/setoran-kecamatan" className="font-medium text-secondary-700 hover:underline">Setoran Kecamatan</Link> pada awal bulan berikutnya dan pilih bulan yang akan dibayar.</>,
            'Lihat kolom Bagian kecamatan dan Sisa untuk tiap kecamatan.',
            'Transfer sebesar Sisa ke rekening kecamatan/mitra yang disepakati.',
            <>Isi nomor referensi transfer lalu klik <b>Catat setoran</b>. Status kecamatan menjadi Lunas bila Sisa sudah nol. Setoran dapat dicatat bertahap.</>,
          ]}
        />
        <p>
          Persentase dihitung memakai pengaturan Bagi Hasil saat halaman dibuka. Ubah persentase pada awal
          bulan, bukan di tengah bulan, agar rekap bulan berjalan tetap sesuai kesepakatan.
        </p>
      </Bagian>

      <Bagian nomor={6} judul="Mencocokkan dana di DOKU">
        <p>
          Saldo akun DOKU sebaiknya tidak lebih kecil dari jumlah kewajiban berikut:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Total saldo pengguna (kartu Total saldo pengguna di Pencairan Dana)</li>
          <li>Total Antrean transfer yang belum dikirim</li>
          <li>Bagian kecamatan yang belum disetor (kolom Sisa di Setoran Kecamatan)</li>
        </ul>
        <p>
          Selisih lebihnya adalah bagian MADANI, sebelum dikurangi biaya DOKU dan biaya transfer. Lakukan
          pengecekan ini sebelum setiap jadwal transfer.
        </p>
      </Bagian>

      <Bagian nomor={7} judul="Pertanyaan yang sering muncul">
        <p>
          <b>Pengguna bertanya kapan dana masuk.</b> Lihat statusnya di Pencairan Dana. Antrean transfer berarti
          sudah disetujui dan menunggu jadwal transfer; Selesai berarti sudah dikirim, nomor referensinya tercatat.
        </p>
        <p>
          <b>Pengguna belum bisa menarik saldo.</b> Sistem meminta KTP terverifikasi sebelum penarikan bila aturan
          KTP aktif. Cek di menu Verifikasi KTP.
        </p>
        <p>
          <b>Persetujuan gagal dengan pesan Saldo tidak cukup.</b> Saldo pengguna sudah berkurang sejak
          pengajuan dibuat. Tolak permintaan tersebut dan beri catatan.
        </p>
      </Bagian>
    </div>
  );
}