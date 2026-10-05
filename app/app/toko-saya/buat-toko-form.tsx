'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronDown } from 'lucide-react';

type Kecamatan = { id: string; nama: string };

export default function BuatTokoForm({ kecamatanList }: { kecamatanList: Kecamatan[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setError(null);
    setIsPending(true);

    try {
      const res = await fetch('/api/toko', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setError(json?.error ?? `Gagal menyimpan (HTTP ${res.status})`);
        return;
      }
      router.refresh();
    } catch {
      setError('Tidak bisa terhubung ke server');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Nama Toko</label>
        <input
          type="text"
          name="nama"
          required
          maxLength={50}
          placeholder="Contoh: Toko Sembako Bu Rina"
          suppressHydrationWarning
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Deskripsi Toko <span className="font-normal text-neutral-400">(opsional)</span>
        </label>
        <textarea
          name="deskripsi"
          rows={3}
          maxLength={500}
          placeholder="Jual apa aja? Kasih tau calon pembeli sekitar..."
          suppressHydrationWarning
          className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
          <MapPin className="h-3.5 w-3.5" /> Kecamatan
        </label>
        <div className="relative">
          <select
            name="kecamatan_id"
            required
            defaultValue=""
            suppressHydrationWarning
            className="w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-3 pr-9 text-sm text-neutral-900 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            <option value="" disabled>Pilih kecamatan toko kamu</option>
            {kecamatanList.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        </div>
        {kecamatanList.length === 0 && (
          <p className="mt-1.5 text-xs text-amber-600">
            Data kecamatan belum tersedia. Hubungi admin.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        suppressHydrationWarning
        className="w-full rounded-lg bg-primary-500 py-3 text-sm font-medium text-white shadow-sm shadow-primary-500/30 hover:bg-primary-600 disabled:opacity-60"
      >
        {isPending ? 'Menyimpan...' : 'Buat Toko & Mulai Jualan'}
      </button>
    </form>
  );
}