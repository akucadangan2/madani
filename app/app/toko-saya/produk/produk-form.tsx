'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const BUCKET = 'produk-foto';
const MAKS_FOTO = 4;
const MAKS_BYTE = 3 * 1024 * 1024;
const TIPE_OK = ['image/jpeg', 'image/png', 'image/webp'];

type HasilForm = { error: string } | { ke: string };

type Props = {
  userId: string;
  kategori: { id: string; nama: string }[];
  action: (fd: FormData) => Promise<HasilForm>;
  tombol: string;
  awal?: {
    nama: string;
    deskripsi: string;
    kategori_id: string;
    harga: number;
    stok: number;
    status: string;
    foto: string[];
  };
};

type FotoBaru = { id: string; file: File; preview: string };

// Kecilkan foto HP (sisi terpanjang 1280px, JPEG) supaya upload cepat dan hemat kuota
async function kecilkan(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const skala = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * skala);
    const h = Math.round(bmp.height * skala);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
    if (!blob || (skala === 1 && blob.size >= file.size)) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

const inputCls =
  'w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

export default function ProdukForm({ userId, kategori, action, tombol, awal }: Props) {
  const router = useRouter();
  const [lama, setLama] = useState<string[]>(awal?.foto ?? []);
  const [baru, setBaru] = useState<FotoBaru[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setErr(null);

    const sisa = MAKS_FOTO - lama.length - baru.length;
    if (sisa <= 0) {
      setErr(`Maksimal ${MAKS_FOTO} foto.`);
      return;
    }

    const hasil: FotoBaru[] = [];
    for (const f of files.slice(0, sisa)) {
      if (!TIPE_OK.includes(f.type)) {
        setErr('Format foto harus JPG, PNG, atau WebP.');
        continue;
      }
      const kecil = await kecilkan(f);
      if (kecil.size > MAKS_BYTE) {
        setErr('Ada foto yang terlalu besar (maksimal 3 MB).');
        continue;
      }
      hasil.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        file: kecil,
        preview: URL.createObjectURL(kecil),
      });
    }
    setBaru((prev) => [...prev, ...hasil]);
  }

  function hapusBaru(id: string) {
    setBaru((prev) => {
      const target = prev.find((b) => b.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((b) => b.id !== id);
    });
  }

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sibuk) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.delete('foto_url');

    setErr(null);
    setSibuk(true);

    const supabase = createClient();
    const terupload: string[] = [];
    const urls: string[] = [...lama];

    try {
      for (const b of baru) {
        const ext = b.file.type === 'image/png' ? 'png' : b.file.type === 'image/webp' ? 'webp' : 'jpg';
        const jalur = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(jalur, b.file, {
          contentType: b.file.type,
          cacheControl: '31536000',
        });
        if (error) throw new Error('Upload foto gagal: ' + error.message);
        terupload.push(jalur);
        urls.push(supabase.storage.from(BUCKET).getPublicUrl(jalur).data.publicUrl);
      }

      urls.forEach((u) => fd.append('foto_url', u));
      const res = await action(fd);

      if ('error' in res) {
        if (terupload.length > 0) await supabase.storage.from(BUCKET).remove(terupload);
        setErr(res.error);
        setSibuk(false);
        return;
      }
      router.push(res.ke);
      router.refresh();
    } catch (ex) {
      if (terupload.length > 0) await supabase.storage.from(BUCKET).remove(terupload);
      setErr(ex instanceof Error ? ex.message : 'Terjadi kesalahan. Coba lagi.');
      setSibuk(false);
    }
  }

  const totalFoto = lama.length + baru.length;

  return (
    <form onSubmit={kirim} className="space-y-5">
      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{err}</div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">
          Foto produk <span className="font-normal text-neutral-400">({totalFoto}/{MAKS_FOTO})</span>
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {lama.map((u, i) => (
            <div key={u} className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                  Utama
                </span>
              )}
              <button
                type="button"
                onClick={() => setLama((prev) => prev.filter((x) => x !== u))}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Hapus foto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {baru.map((b, i) => (
            <div key={b.id} className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.preview} alt="" className="h-full w-full object-cover" />
              {lama.length + i === 0 && (
                <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                  Utama
                </span>
              )}
              <button
                type="button"
                onClick={() => hapusBaru(b.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Hapus foto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {totalFoto < MAKS_FOTO && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-300 bg-white text-neutral-500 hover:border-primary-400 hover:text-primary-600">
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs">Tambah</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={pilih}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="mt-1.5 text-xs text-neutral-500">
          Foto pertama jadi foto utama. Format JPG, PNG, atau WebP. Ukuran otomatis dikecilkan.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">Nama produk</label>
        <input name="nama" required minLength={3} maxLength={120} defaultValue={awal?.nama ?? ''} className={inputCls} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">Deskripsi</label>
        <textarea
          name="deskripsi"
          rows={4}
          maxLength={2000}
          defaultValue={awal?.deskripsi ?? ''}
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">Kategori</label>
        <select name="kategori_id" defaultValue={awal?.kategori_id ?? ''} className={inputCls}>
          <option value="">Tanpa kategori</option>
          {kategori.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-800">Harga (Rp)</label>
          <input
            type="number"
            name="harga"
            required
            min={1}
            step={1}
            inputMode="numeric"
            defaultValue={awal?.harga ?? ''}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-800">Stok</label>
          <input
            type="number"
            name="stok"
            required
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={awal?.stok ?? ''}
            className={inputCls}
          />
        </div>
      </div>

      {awal && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-800">Status</label>
          <select name="status" defaultValue={awal.status === 'nonaktif' ? 'nonaktif' : 'aktif'} className={inputCls}>
            <option value="aktif">Tampil di marketplace</option>
            <option value="nonaktif">Disembunyikan</option>
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={sibuk}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-500 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
      >
        {sibuk && <Loader2 className="h-4 w-4 animate-spin" />}
        {sibuk ? 'Menyimpan...' : tombol}
      </button>
    </form>
  );
}