'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';

type Wilayah = {
  kode: string;
  nama: string;
  kabupaten: string;
  provinsi: string;
  kecamatan_id: string | null;
};

type Props = {
  value: string;
  nama: string;
  onChange: (id: string, nama: string) => void;
  name?: string;
  placeholder?: string;
};

const KELAS_INPUT =
  'w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';

export function PilihKecamatan({
  value,
  nama,
  onChange,
  name,
  placeholder = 'Ketik kecamatan, kota, atau provinsi',
}: Props) {
  const [q, setQ] = useState('');
  const [hasil, setHasil] = useState<Wilayah[]>([]);
  const [buka, setBuka] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const urut = useRef(0);
  const wadah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;
    const no = ++urut.current;
    setMemuat(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/wilayah/cari?q=${encodeURIComponent(q.trim())}`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (no !== urut.current) return;
        setHasil(Array.isArray(json.data) ? json.data : []);
        setGalat(res.ok ? null : 'Gagal memuat daftar wilayah.');
      } catch {
        if (no === urut.current) setGalat('Gagal memuat daftar wilayah.');
      } finally {
        if (no === urut.current) setMemuat(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, buka]);

  useEffect(() => {
    function luar(e: MouseEvent) {
      if (wadah.current && !wadah.current.contains(e.target as Node)) setBuka(false);
    }
    document.addEventListener('mousedown', luar);
    return () => document.removeEventListener('mousedown', luar);
  }, []);

  async function pilih(w: Wilayah) {
    setGalat(null);
    if (w.kecamatan_id) {
      onChange(w.kecamatan_id, w.nama);
      setBuka(false);
      setQ('');
      return;
    }
    setMenyimpan(true);
    try {
      const res = await fetch('/api/wilayah/pastikan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kode: w.kode }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setGalat(json?.error ?? 'Gagal memilih kecamatan');
        return;
      }
      onChange(String(json.id), w.nama);
      setBuka(false);
      setQ('');
    } catch {
      setGalat('Tidak bisa terhubung ke server');
    } finally {
      setMenyimpan(false);
    }
  }

  const tampilTerpilih = value !== '' && nama !== '' && !buka;

  return (
    <div ref={wadah} className="relative">
      {name && <input type="hidden" name={name} value={value} />}

      {tampilTerpilih ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900">
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
            <span className="truncate">{nama}</span>
          </span>
          <button
            type="button"
            onClick={() => setBuka(true)}
            className="shrink-0 text-xs font-medium text-primary-600 hover:underline"
          >
            Ganti
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setBuka(true);
            }}
            onFocus={() => setBuka(true)}
            placeholder={placeholder}
            autoComplete="off"
            className={KELAS_INPUT}
          />
        </div>
      )}

      {buka && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
          {(memuat || menyimpan) && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {menyimpan ? 'Menyimpan pilihan...' : 'Mencari...'}
            </div>
          )}
          {galat && <p className="px-3 py-2 text-xs text-red-600">{galat}</p>}
          {hasil.map((w) => (
            <button
              key={w.kode}
              type="button"
              disabled={menyimpan}
              onClick={() => pilih(w)}
              className="block w-full px-3 py-2 text-left hover:bg-neutral-50 disabled:opacity-60"
            >
              <span className="block text-sm text-neutral-900">{w.nama}</span>
              <span className="block text-xs text-neutral-500">{w.provinsi}</span>
            </button>
          ))}
          {!memuat && !galat && hasil.length === 0 && (
            <p className="px-3 py-3 text-xs text-neutral-500">
              Kecamatan tidak ditemukan. Coba tulis nama kota atau provinsinya.
            </p>
          )}
        </div>
      )}
    </div>
  );
}