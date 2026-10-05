'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const MAKS = 5 * 1024 * 1024;
const EKSTENSI: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function FotoInput({
  label,
  hint,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-800">{label}</label>
      <label className="flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-white text-center hover:border-neutral-400">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-44 w-full object-cover" />
        ) : (
          <div className="px-4 py-8 text-neutral-500">
            <Camera className="mx-auto h-7 w-7" />
            <div className="mt-2 text-sm font-medium">Ambil / pilih foto</div>
            <div className="mt-0.5 text-xs">{hint}</div>
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
      {preview && <div className="mt-1 text-xs text-neutral-500">Ketuk foto untuk mengganti</div>}
    </div>
  );
}

export default function KtpForm() {
  const router = useRouter();
  const [nik, setNik] = useState('');
  const [ktp, setKtp] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cekFile(f: File, nama: string): string | null {
    if (!EKSTENSI[f.type]) return `${nama}: format harus JPG, PNG, atau WebP`;
    if (f.size > MAKS) return `${nama}: ukuran maksimal 5 MB`;
    return null;
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{16}$/.test(nik)) return setError('NIK harus 16 digit angka');
    if (!ktp) return setError('Foto KTP wajib diisi');
    if (!selfie) return setError('Foto selfie sambil memegang KTP wajib diisi');
    const salah = cekFile(ktp, 'Foto KTP') ?? cekFile(selfie, 'Foto selfie');
    if (salah) return setError(salah);

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.assign('/login');
      return;
    }

    const stamp = Date.now();
    const pathKtp = `${user.id}/ktp-${stamp}.${EKSTENSI[ktp.type]}`;
    const pathSelfie = `${user.id}/selfie-${stamp}.${EKSTENSI[selfie.type]}`;

    const up1 = await supabase.storage.from('ktp').upload(pathKtp, ktp, { contentType: ktp.type });
    if (up1.error) {
      setLoading(false);
      return setError('Gagal mengunggah foto KTP: ' + up1.error.message);
    }
    const up2 = await supabase.storage.from('ktp').upload(pathSelfie, selfie, { contentType: selfie.type });
    if (up2.error) {
      await supabase.storage.from('ktp').remove([pathKtp]);
      setLoading(false);
      return setError('Gagal mengunggah foto selfie: ' + up2.error.message);
    }

    const { error: insErr } = await supabase.from('verifikasi_ktp').insert({
      user_id: user.id,
      nomor_ktp: nik,
      foto_ktp_url: pathKtp,
      foto_selfie_url: pathSelfie,
      status: 'menunggu',
    });

    if (insErr) {
      await supabase.storage.from('ktp').remove([pathKtp, pathSelfie]);
      setLoading(false);
      return setError(
        insErr.code === '23505'
          ? 'NIK ini sudah dipakai pengajuan lain, atau kamu masih punya pengajuan aktif'
          : insErr.message
      );
    }

    setLoading(false);
    router.refresh();
  }

  const input =
    'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-neutral-400';

  return (
    <form onSubmit={kirim} className="mt-6 space-y-5">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">NIK (16 digit)</label>
        <input
          value={nik}
          onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
          inputMode="numeric"
          placeholder="3201xxxxxxxxxxxx"
          className={input}
        />
      </div>

      <FotoInput label="Foto KTP" hint="Seluruh KTP terlihat jelas, tidak buram" file={ktp} onChange={setKtp} />
      <FotoInput
        label="Selfie sambil memegang KTP"
        hint="Wajah dan KTP terlihat jelas dalam satu foto"
        file={selfie}
        onChange={setSelfie}
      />

      <button
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 py-3.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Mengunggah...' : 'Kirim untuk diverifikasi'}
      </button>

      <p className="text-center text-xs text-neutral-500">
        Foto disimpan privat dan hanya bisa dilihat admin MADANI untuk keperluan verifikasi.
      </p>
    </form>
  );
}