'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Briefcase, MapPin, Loader2, AlertCircle, Lightbulb,
  ChevronDown, Wallet, FileText, Tag,
} from 'lucide-react';
import { postingKerja } from '@/lib/actions/kerja';

type Opsi = { id: string | number; nama: string };

const TIPS = [
  'Tulis judul yang spesifik, misalnya "Bantu Angkut Barang Gudang" bukan cuma "Butuh Pekerja".',
  'Jelaskan jam kerja, lokasi persis, dan syarat yang dibutuhkan di deskripsi.',
  'Pasang upah yang wajar sesuai beban kerja — ini yang paling dilihat pencari kerja.',
  'Dana upah ditahan sistem (escrow) dan baru cair setelah kamu tandai pekerjaan selesai.',
];

function formatRibuan(digitsOnly: string) {
  if (!digitsOnly) return '';
  return Number(digitsOnly).toLocaleString('id-ID');
}

export function PostingForm({
  kategoriList,
  kecamatanList,
}: {
  kategoriList: Opsi[];
  kecamatanList: Opsi[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [kecamatanId, setKecamatanId] = useState('');
  const [upahDigits, setUpahDigits] = useState('');
  const [error, setError] = useState<string | null>(null);

  const kategoriTerpilih = kategoriList.find((k) => String(k.id) === kategoriId);
  const kecamatanTerpilih = kecamatanList.find((k) => String(k.id) === kecamatanId);

  const isValid =
    judul.trim().length >= 5 &&
    deskripsi.trim().length >= 20 &&
    kategoriId !== '' &&
    kecamatanId !== '' &&
    Number(upahDigits) > 0;

  function handleUpahChange(value: string) {
    const digitsOnly = value.replace(/\D/g, '');
    setUpahDigits(digitsOnly);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError('Lengkapi semua kolom dengan benar dulu ya.');
      return;
    }

    const formData = new FormData();
    formData.set('judul', judul.trim());
    formData.set('deskripsi', deskripsi.trim());
    formData.set('kategoriId', kategoriId);
    formData.set('kecamatanId', kecamatanId);
    formData.set('upah', upahDigits);

    startTransition(async () => {
      const result = await postingKerja(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/kerja/${result.taskId}`);
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-28 lg:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/kerja"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-neutral-900 sm:text-xl">Posting Kerja</h1>
            <p className="text-sm text-neutral-500">Cari kandidat dari warga di kecamatanmu</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Form fields */}
          <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-red-50 px-3.5 py-3 text-sm text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Kategori & Kecamatan */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <Tag className="h-3.5 w-3.5" /> Kategori Pekerjaan
                </label>
                <div className="relative">
                  <select
                    value={kategoriId}
                    onChange={(e) => setKategoriId(e.target.value)}
                    required
                    className="w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-3 pr-9 text-sm text-neutral-900 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="" disabled>Pilih kategori</option>
                    {kategoriList.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <MapPin className="h-3.5 w-3.5" /> Kecamatan
                </label>
                <div className="relative">
                  <select
                    value={kecamatanId}
                    onChange={(e) => setKecamatanId(e.target.value)}
                    required
                    className="w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-3 pr-9 text-sm text-neutral-900 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="" disabled>Pilih kecamatan</option>
                    {kecamatanList.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>
            </div>

            {/* Judul */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <Briefcase className="h-3.5 w-3.5" /> Judul Pekerjaan
                </label>
                <span className="text-xs text-neutral-400">{judul.length}/100</span>
              </div>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value.slice(0, 100))}
                required
                placeholder='Contoh: "Bantu Angkut Barang di Gudang"'
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              {judul.length > 0 && judul.trim().length < 5 && (
                <p className="mt-1 text-xs text-danger">Judul minimal 5 karakter</p>
              )}
            </div>

            {/* Deskripsi */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <FileText className="h-3.5 w-3.5" /> Deskripsi Pekerjaan
                </label>
                <span className="text-xs text-neutral-400">{deskripsi.length}/2000</span>
              </div>
              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value.slice(0, 2000))}
                required
                rows={6}
                placeholder="Jelaskan detail tugas, jam kerja, lokasi persis, dan syarat yang dibutuhkan..."
                className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              {deskripsi.length > 0 && deskripsi.trim().length < 20 && (
                <p className="mt-1 text-xs text-danger">Deskripsi minimal 20 karakter</p>
              )}
            </div>

            {/* Upah */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                <Wallet className="h-3.5 w-3.5" /> Upah yang Ditawarkan
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatRibuan(upahDigits)}
                  onChange={(e) => handleUpahChange(e.target.value)}
                  required
                  placeholder="0"
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-3.5 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <p className="mt-1.5 text-xs text-neutral-400">
                Dana ditahan sistem (escrow) dan baru dicairkan setelah kamu tandai pekerjaan selesai.
              </p>
            </div>

            {/* Submit — desktop */}
            <button
              type="submit"
              disabled={isPending}
              className="hidden w-full items-center justify-center gap-2 rounded-lg bg-primary-500 py-3 text-sm font-medium text-white shadow-sm shadow-primary-500/30 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 lg:flex"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memposting...
                </>
              ) : (
                'Posting Lowongan'
              )}
            </button>
          </div>

          {/* Preview + tips — desktop sidebar */}
          <div className="hidden space-y-5 lg:block">
            <div className="sticky top-24 space-y-5">
              <div>
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Preview Tampilan
                </p>
                <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                      <Briefcase className="h-3 w-3" />
                      {kategoriTerpilih?.nama ?? 'Kategori'}
                    </span>
                    <span className="text-xs text-neutral-400">Baru saja</span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-base font-semibold text-neutral-900">
                    {judul || 'Judul pekerjaan kamu'}
                  </h3>
                  <p className="mt-1.5 flex items-center gap-1 text-sm text-neutral-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {kecamatanTerpilih?.nama ?? 'Kecamatan'}
                  </p>
                  <p className="mt-2.5 line-clamp-2 text-sm text-neutral-500">
                    {deskripsi || 'Deskripsi pekerjaan akan muncul di sini...'}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3.5">
                    <span className="text-base font-bold text-primary-700">
                      {upahDigits ? `Rp ${formatRibuan(upahDigits)}` : 'Rp 0'}
                    </span>
                    <span className="text-sm font-medium text-neutral-400">Detail →</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-secondary-100 bg-secondary-50 p-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-secondary-700">
                  <Lightbulb className="h-4 w-4" /> Tips Postingan Efektif
                </p>
                <ul className="space-y-2 text-sm text-secondary-700/90">
                  {TIPS.map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-secondary-500" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Submit — mobile sticky bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 py-3 text-sm font-medium text-white shadow-sm shadow-primary-500/30 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Memposting...
              </>
            ) : (
              'Posting Lowongan'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}