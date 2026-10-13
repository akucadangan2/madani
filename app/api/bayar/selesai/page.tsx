import Link from 'next/link';
import { Maskot } from '@/components/maskot';

export const metadata = { title: 'Pembayaran diproses | MADANI' };

export default function BayarSelesai() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <Maskot pose="jempol" className="h-40 w-auto" />
      <h1 className="font-display mt-6 text-2xl font-extrabold text-ink-800">Terima kasih!</h1>
      <p className="mt-2 text-ink-700">
        Pembayaranmu sedang kami proses, biasanya hanya beberapa detik. Kembali ke aplikasi MADANI,
        lalu tarik layar ke bawah untuk menyegarkan status.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-primary-500 px-6 py-3 font-bold text-white"
      >
        Ke beranda
      </Link>
    </main>
  );
}