import Link from 'next/link';

export const metadata = {
  title: 'Kebijakan Pengembalian Dana (Refund) dan Pembatalan',
  description: 'Ketentuan pembatalan pesanan, komplain, dan pengembalian dana di MADANI.',
};

const BAGIAN: { judul: string; isi: string[] }[] = [
  {
    judul: '1. Ruang lingkup',
    isi: [
      'Kebijakan ini berlaku untuk transaksi barang (pembeli dan penjual) dan pekerjaan harian (pemberi kerja dan pekerja) yang dilakukan melalui MADANI.',
      'Kebijakan ini mulai berlaku untuk pembayaran setelah fitur pembayaran dinyatakan aktif. Selama masa uji coba, tidak ada dana nyata yang diproses.',
    ],
  },
  {
    judul: '2. Pembatalan pesanan barang',
    isi: [
      'Pembeli dapat membatalkan pesanan selama penjual belum mulai memproses. Dana dikembalikan penuh.',
      'Jika pesanan sudah diproses atau diantar, pembatalan dilakukan atas kesepakatan pembeli dan penjual lewat chat. Jika tidak sepakat, pembeli dapat mengajukan komplain.',
      'Penjual dapat membatalkan pesanan jika stok habis atau barang tidak dapat dikirim. Dana pembeli dikembalikan penuh.',
    ],
  },
  {
    judul: '3. Barang bermasalah dan komplain',
    isi: [
      'Pembeli dapat mengajukan komplain dalam 2 x 24 jam setelah barang diterima jika barang tidak sesuai pesanan, rusak, atau tidak sampai.',
      'Sertakan foto atau video sebagai bukti agar peninjauan lebih cepat. Tim MADANI meninjau komplain dan memberi keputusan paling lambat 3 hari kerja.',
      'Keputusan dapat berupa pengembalian dana penuh, pengembalian dana sebagian, penggantian barang, atau komplain ditolak apabila tidak ada kekeliruan dari pihak penjual.',
    ],
  },
  {
    judul: '4. Barang yang tidak dapat dikembalikan',
    isi: [
      'Makanan, minuman, dan hasil kebun segar yang sudah diterima sesuai pesanan dan dalam kondisi baik tidak dapat dikembalikan atau dibatalkan.',
      'Barang yang rusak karena pemakaian setelah diterima tidak termasuk dalam pengembalian dana.',
    ],
  },
  {
    judul: '5. Pembatalan dan komplain pekerjaan',
    isi: [
      'Pemberi kerja dapat membatalkan lowongan kapan saja selama belum ada pelamar yang dipilih, tanpa biaya.',
      'Setelah pelamar dipilih dan pekerjaan belum dimulai, pembatalan dilakukan atas kesepakatan kedua pihak lewat chat.',
      'Jika pekerjaan tidak dikerjakan atau tidak sesuai kesepakatan, pemberi kerja dapat mengajukan komplain. Tim MADANI meninjau dan memutuskan pengembalian dana penuh, sebagian, atau menolak komplain.',
    ],
  },
  {
    judul: '6. Proses pengembalian dana',
    isi: [
      'Dana yang disetujui untuk dikembalikan akan dikreditkan ke metode pembayaran asal atau ke saldo MADANI pembeli.',
      'Waktu proses hingga 7 hari kerja setelah komplain disetujui, bergantung pada penyedia layanan pembayaran.',
    ],
  },
  {
    judul: '7. Cara mengajukan',
    isi: [
      'Ajukan komplain lewat menu Pesanan atau Riwayat di aplikasi dan web MADANI, atau hubungi kami lewat halaman Kontak.',
    ],
  },
];

export default function RefundPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
      <h1 className="text-2xl font-extrabold leading-tight text-ink-700 sm:text-4xl">
        Kebijakan Pengembalian Dana (Refund) dan Pembatalan
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Terakhir diperbarui: 12 Oktober 2026</p>

      <div className="mt-8 space-y-7">
        {BAGIAN.map((b) => (
          <section key={b.judul}>
            <h2 className="font-display text-xl font-bold text-ink-700">{b.judul}</h2>
            <div className="mt-2 space-y-2 leading-relaxed text-neutral-700">
              {b.isi.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 rounded-2xl bg-ink-50 p-5 text-neutral-700">
        Ada pertanyaan? Lihat{' '}
        <Link href="/syarat" className="font-semibold text-secondary-700 underline">Syarat dan Ketentuan</Link>,{' '}
        <Link href="/privasi" className="font-semibold text-secondary-700 underline">Kebijakan Privasi</Link>, atau{' '}
        <Link href="/kontak" className="font-semibold text-secondary-700 underline">hubungi kami</Link>.
      </p>
    </main>
  );
}