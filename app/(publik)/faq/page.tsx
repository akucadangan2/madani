import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronDown } from 'lucide-react';
import { Maskot } from '@/components/maskot';

export const metadata: Metadata = {
  title: 'Pertanyaan yang sering muncul',
  description:
    'Jawaban atas pertanyaan umum tentang MADANI: biaya, cara masuk, verifikasi KTP, pembayaran, dan keamanan data.',
};

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Apakah MADANI gratis?',
    a: 'Daftar dan membuka toko gratis. Pada transaksi, ada pembagian bawaan: 7% untuk MADANI, 90% untuk pekerja atau penjual, dan 3% untuk kecamatan. Angka ini bisa diatur per kecamatan.',
  },
  {
    q: 'Bagaimana cara masuk?',
    a: 'Masukkan nomor WhatsApp, lalu isi kode OTP yang kami kirim. Tidak ada password yang perlu diingat.',
  },
  {
    q: 'Apakah harus pasang aplikasi?',
    a: 'Tidak harus. MADANI bisa dipakai lewat browser di HP maupun laptop. Aplikasi Android dan iOS sedang disiapkan.',
  },
  {
    q: 'Kenapa perlu verifikasi KTP?',
    a: 'Untuk melamar kerja, membayar, atau menarik saldo, kami meminta verifikasi KTP supaya penipuan sulit terjadi. Foto KTP disimpan di penyimpanan privat dan hanya dilihat admin untuk verifikasi.',
  },
  {
    q: 'Kapan sebuah transaksi dianggap selesai?',
    a: 'Untuk pesanan barang, setelah pembeli mengonfirmasi barang diterima. Untuk pekerjaan, setelah pemberi kerja menandai pekerjaan selesai. Setelah itu kedua pihak bisa saling memberi penilaian.',
  },
  {
    q: 'Bagaimana dengan pembayaran dan saldo?',
    a: 'Fitur pembayaran dan saldo saat ini masih dalam tahap uji coba bertahap. Metode pembayaran resmi akan diumumkan setelah aktif.',
  },
  {
    q: 'Bagaimana kalau ada masalah?',
    a: 'Ajukan komplain lewat aplikasi, tim kami akan meninjau dan membantu menyelesaikannya. Konten atau pengguna mencurigakan bisa dilaporkan lewat tombol Laporkan.',
  },
  {
    q: 'Apakah barang kena ongkir ekspedisi?',
    a: 'Tidak. Barang diantar penjual satu kecamatan, jadi tanpa ongkir ekspedisi. Kesepakatan antar dilakukan lewat chat dengan penjual.',
  },
  {
    q: 'Bisa jadi pembeli sekaligus penjual?',
    a: 'Bisa. Satu akun boleh punya beberapa peran dan kamu tinggal berpindah peran dari menu Akun.',
  },
  {
    q: 'Kecamatanku belum tersedia, bagaimana?',
    a: 'Wilayah ditambahkan oleh tim MADANI. Hubungi kami lewat halaman Kontak untuk mengajukan kecamatanmu.',
  },
  {
    q: 'Apakah data pribadiku aman?',
    a: 'Data dipakai hanya untuk menjalankan layanan. Foto KTP disimpan di penyimpanan privat. Penjelasan lengkap ada di halaman Kebijakan Privasi.',
  },
];

export default function FaqPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-5 sm:py-14">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl md:text-4xl">
          Pertanyaan yang sering muncul
        </h1>
        <Maskot pose="tunjuk" className="h-28 w-auto shrink-0 sm:h-36" />
      </div>

      <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        {FAQ.map((f) => (
          <details key={f.q} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-display text-base font-bold text-ink-700 sm:text-lg [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-4 pr-6 leading-relaxed text-neutral-600">{f.a}</p>
          </details>
        ))}
        <details className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-display text-base font-bold text-ink-700 sm:text-lg [&::-webkit-details-marker]:hidden">
            <span>Bagaimana cara menghapus akun?</span>
            <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
          </summary>
          <p className="pb-4 pr-6 leading-relaxed text-neutral-600">
            Buka menu Akun di aplikasi lalu pilih Hapus akun saya, atau kunjungi halaman{' '}
            <Link href="/hapus-akun" className="font-semibold text-secondary-700 underline">Hapus Akun</Link>.
            Penjelasan lengkap ada di{' '}
            <Link href="/privasi" className="font-semibold text-secondary-700 underline">Kebijakan Privasi</Link>.
          </p>
        </details>
      </div>
    </section>
  );
}