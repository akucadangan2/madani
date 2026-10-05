'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, Phone, ShieldCheck, User } from 'lucide-react';

const inputCls =
  'h-14 w-full rounded-2xl border-2 border-neutral-200 bg-white pl-12 pr-4 text-[15px] font-medium text-neutral-900 outline-none transition placeholder:font-normal placeholder:text-neutral-400 focus:border-ink-700';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nama = fullName.trim();
    if (nama.length < 3) {
      setError('Nama lengkap minimal 3 karakter');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? 'Gagal mengirim OTP, coba lagi');
        setLoading(false);
        return;
      }

      const nomor = data?.phone ?? phone;
      router.push(`/verify-otp?phone=${encodeURIComponent(nomor)}&fullName=${encodeURIComponent(nama)}`);
    } catch {
      setError('Tidak bisa terhubung ke server');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-20">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
          <User className="h-6 w-6" />
        </div>

        <h1 className="text-3xl font-extrabold text-ink-700">Buat akun baru</h1>
        <p className="mt-2 text-neutral-600">
          Gratis daftar, verifikasi lewat WhatsApp, langsung bisa mulai.
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <label htmlFor="nama" className="mb-1.5 block text-sm font-semibold text-neutral-800">
              Nama lengkap
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                id="nama"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError('');
                }}
                required
                autoComplete="name"
                placeholder="Sesuai KTP"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-neutral-800">
              Nomor HP (WhatsApp)
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (error) setError('');
                }}
                required
                placeholder="0812 3456 7890"
                className={inputCls}
              />
            </div>
            <p className="mt-1.5 text-xs text-neutral-500">Kode OTP dikirim ke nomor ini lewat WhatsApp.</p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink-700 py-3.5 font-semibold text-white hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengirim OTP...
            </>
          ) : (
            <>
              Kirim OTP via WhatsApp
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="mt-6 flex items-start gap-3 rounded-xl bg-neutral-50 p-3.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
          <p className="text-xs leading-5 text-neutral-500">
            Kode OTP hanya dipakai untuk masuk. Jangan berikan kode ini kepada siapa pun.
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-ink-700 underline underline-offset-4">
            Masuk
          </Link>
        </p>
      </form>
    </div>
  );
}