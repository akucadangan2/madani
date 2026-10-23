'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const BUCKET = 'dokumen-pekerja';
const MAKS_BYTE = 5 * 1024 * 1024;
const TIPE_OK = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const JENIS = [
  { v: 'sertifikat', t: 'Sertifikat' },
  { v: 'keahlian', t: 'Bukti keahlian' },
  { v: 'sim', t: 'SIM' },
  { v: 'lainnya', t: 'Lainnya' },
];

export default function DokumenForm({ userId, jumlah }: { userId: string; jumlah: number }) {
  const router = useRouter();
  const [jenis, setJenis] = useState('sertifikat');
  const [publik, setPublik] = useState(true);
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const judul = String(fd.get('judul') ?? '').trim();
    const berkas = fd.get('berkas') as File | null;

    if (jumlah >= 15) return setError('Maksimal 15 dokumen.');
    if (judul.length < 2) return setError('Isi nama dokumen.');
    if (!berkas || berkas.size === 0) return setError('Pilih berkas dulu.');
    if (!TIPE_OK.includes(berkas.type)) return setError('Berkas harus JPG, PNG, WEBP, atau PDF.');
    if (berkas.size > MAKS_BYTE) return setError('Ukuran berkas maksimal 5 MB.');

    setSibuk(true);
    try {
      const supabase = createClient();
      const ext = berkas.type === 'application/pdf' ? 'pdf' : berkas.type.split('/')[1].replace('jpeg', 'jpg');
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: up } = await supabase.storage.from(BUCKET).upload(path, berkas, { contentType: berkas.type });
      if (up) throw new Error(up.message);
      const { error: ins } = await supabase
        .from('dokumen_pekerja')
        .insert({ user_id: userId, jenis, judul, path, tampil_publik: publik });
      if (ins) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw new Error(ins.message);
      }
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah dokumen.');
    } finally {
      setSibuk(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';

  return (
    <form onSubmit={kirim} className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {JENIS.map((j) => (
          <button
            key={j.v}
            type="button"
            onClick={() => {
              setJenis(j.v);
              setPublik(j.v !== 'sim');
            }}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              jenis === j.v ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-600'
            }`}
          >
            {j.t}
          </button>
        ))}
      </div>

      <input name="judul" maxLength={80} placeholder="Nama dokumen, mis. Sertifikat tukang listrik" className={inputCls} />
      <input name="berkas" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={inputCls} />

      <label className="flex items-start gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={publik} onChange={(e) => setPublik(e.target.checked)} className="mt-1" />
        <span>
          Tampilkan ke pemberi kerja
          {jenis === 'sim' && <span className="block text-xs text-neutral-500">SIM memuat data pribadi. Nyalakan hanya bila perlu.</span>}
        </span>
      </label>

      <button
        type="submit"
        disabled={sibuk}
        className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
      >
        {sibuk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {sibuk ? 'Mengunggah...' : 'Simpan dokumen'}
      </button>
    </form>
  );
}