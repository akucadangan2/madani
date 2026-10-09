import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Briefcase, MapPin, Clock } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/current-user';
import { ambilLowongan, rupiah, satu, waktuRelatif } from '@/lib/publik';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = await ambilLowongan(id);
  if (!t) return { title: 'Lowongan tidak ditemukan' };
  return {
    title: t.judul,
    description: `Upah ${rupiah(t.upah)}. Lowongan kerja harian di kecamatanmu.`,
  };
}

export default async function LowonganDetailPage({ params }: Props) {
  const { id } = await params;
  const [t, user] = await Promise.all([ambilLowongan(id), getCurrentUser()]);
  if (!t) notFound();

  const kategori = satu(t.kategori)?.nama;
  const kecamatan = satu(t.kecamatan)?.nama;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
      <Link href="/lowongan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Semua lowongan
      </Link>

      <div className="mt-5 rounded-[24px] border border-neutral-200 p-5 sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700">
          <Briefcase className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl">{t.judul}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-600">
          {kecamatan && (
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{kecamatan}</span>
          )}
          {kategori && <span className="rounded-full bg-ink-50 px-3 py-1 font-medium">{kategori}</span>}
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{waktuRelatif(t.created_at)}</span>
        </div>

        <p className="mt-5 inline-block rounded-md bg-sun-400 px-3 py-1 text-lg font-bold text-ink-800">{rupiah(t.upah)}</p>

        <h2 className="mt-7 font-display text-lg font-bold text-ink-700">Deskripsi pekerjaan</h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-neutral-700">
          {t.deskripsi?.trim() || 'Pemberi kerja belum menambahkan deskripsi.'}
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-ink-50 p-5 sm:p-6">
        {user ? (
          <>
            <p className="font-display text-lg font-bold text-ink-700">Tertarik dengan lowongan ini?</p>
            <p className="mt-1 text-sm text-neutral-600">Buka beranda untuk melamar dan melanjutkan lewat chat.</p>
            <Link href="/beranda" className="mt-4 inline-flex w-full justify-center rounded-full bg-ink-700 px-7 py-3.5 font-semibold text-white hover:bg-ink-800 sm:w-auto">
              Ke beranda
            </Link>
          </>
        ) : (
          <>
            <p className="font-display text-lg font-bold text-ink-700">Mau melamar lowongan ini?</p>
            <p className="mt-1 text-sm text-neutral-600">
              Daftar gratis lewat kode WhatsApp. Untuk melamar, kamu perlu verifikasi KTP lebih dulu.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link href="/register" className="inline-flex justify-center rounded-full bg-ink-700 px-7 py-3.5 font-semibold text-white hover:bg-ink-800">
                Daftar untuk melamar
              </Link>
              <Link href="/login" className="inline-flex justify-center rounded-full border-2 border-ink-700 px-7 py-3.5 font-semibold text-ink-700 hover:bg-white">
                Saya sudah punya akun
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}