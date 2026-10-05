'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function VerifyOtpForm() {
  const params = useSearchParams();
  const phone = params.get('phone') || '';
  const fullName = params.get('fullName') || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, fullName }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.access_token) {
        setError(data?.error ?? 'Verifikasi gagal, coba lagi');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      let target = '/pilih-peran';
      if (user) {
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
        if (roles && roles.length > 0) target = '/beranda';
      }

      // Navigasi penuh supaya cookie session terbaca server dan cache router lama tidak dipakai.
      window.location.assign(target);
    } catch {
      setError('Tidak bisa terhubung ke server');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-20">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
          <MessageCircle className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-ink-700">Masukkan kode OTP</h1>
        <p className="mt-2 text-neutral-600">
          Kode 6 digit sudah dikirim lewat WhatsApp ke <span className="font-semibold text-ink-700">{phone}</span>.
        </p>
        {fullName && (
          <p className="mt-1 text-sm text-neutral-500">
            Mendaftar sebagai <span className="font-semibold text-neutral-700">{fullName}</span>
          </p>
        )}

        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ''));
            if (error) setError('');
          }}
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          aria-label="Kode OTP"
          className="mt-8 w-full rounded-2xl border-2 border-neutral-200 bg-white px-4 py-4 text-center font-display text-3xl font-bold tracking-[0.5em] text-ink-700 placeholder:text-neutral-300 focus:border-ink-700 focus:outline-none"
        />

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          disabled={loading || code.length < 6}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink-700 py-3.5 font-semibold text-white hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Memverifikasi...' : 'Verifikasi'}
        </button>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Salah nomor?{' '}
          <Link href="/login" className="font-semibold text-ink-700 underline underline-offset-4">
            Ganti nomor
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}