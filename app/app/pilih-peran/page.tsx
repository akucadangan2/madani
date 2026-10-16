'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Briefcase, Building2, ShoppingBag, ShoppingCart, Check, Loader2, ArrowRight, Lock } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'pembeli', label: 'Pembeli', desc: 'Belanja di marketplace', icon: ShoppingCart, butuhKtp: false },
  { value: 'pemberi_kerja', label: 'Pemberi Kerja / UMKM', desc: 'Posting lowongan kerja', icon: Building2, butuhKtp: false },
  { value: 'penjual', label: 'Penjual', desc: 'Buka toko dan jual produk', icon: ShoppingBag, butuhKtp: true },
  { value: 'pencari_kerja', label: 'Pencari Kerja', desc: 'Cari dan lamar lowongan kerja', icon: Briefcase, butuhKtp: true },
];

const ROLE_REDIRECT: Record<string, string> = {
  pemberi_kerja: '/kerja/posting',
  pencari_kerja: '/kerja',
  penjual: '/toko-saya',
  pembeli: '/marketplace',
};

export default function PilihPeranPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [sudah, setSudah] = useState<string[]>([]);
  const [ktpOk, setKtpOk] = useState(false);
  const [siap, setSiap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const jalan = useRef(false);

  useEffect(() => {
    if (jalan.current) return;
    jalan.current = true;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.assign('/login');
        return;
      }

      const [{ data: peran }, { data: ktp }] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', user.id),
        supabase.from('verifikasi_ktp').select('status').eq('user_id', user.id).limit(1).maybeSingle(),
      ]);
      const roles = (peran ?? []).map((r) => String(r.role));

      // Pendaftar baru otomatis menjadi Pembeli dan Pemberi Kerja (tanpa KTP).
      if (roles.length === 0) {
        const { error: eAwal } = await supabase.from('user_roles').insert([
          { user_id: user.id, role: 'pembeli' },
          { user_id: user.id, role: 'pemberi_kerja' },
        ]);
        if (!eAwal) {
          await supabase.from('profiles').update({ active_role: 'pembeli' }).eq('id', user.id);
          window.location.assign(ROLE_REDIRECT.pembeli);
          return;
        }
        setError(eAwal.message);
      }

      setSudah(roles);
      setKtpOk(ktp?.status === 'terverifikasi');
      setSiap(true);
    })();
  }, []);

  function keHalamanKtp() {
    window.location.assign(window.location.pathname.replace(/pilih-peran\/?$/, 'profil/verifikasi-ktp'));
  }

  function toggle(role: string) {
    setSelected((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  async function handleSubmit() {
    if (selected.length === 0) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      window.location.assign('/login');
      return;
    }

    const { error: roleError } = await supabase
      .from('user_roles')
      .insert(selected.map((role) => ({ user_id: user.id, role })));
    if (roleError) {
      setLoading(false);
      setError(roleError.message);
      return;
    }

    // Peran aktif hanya diisi kalau belum punya peran sebelumnya.
    if (sudah.length === 0) {
      await supabase.from('profiles').update({ active_role: selected[0] }).eq('id', user.id);
    }

    // Navigasi penuh supaya cookie session & data role terbaca server.
    window.location.assign(ROLE_REDIRECT[selected[0]] ?? '/kerja');
  }

  if (!siap) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <span className="text-lg font-bold text-primary-700">MADANI</span>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">Tambah peran</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Pembeli dan Pemberi Kerja aktif otomatis. Penjual dan Pencari Kerja perlu verifikasi KTP.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {ROLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const punya = sudah.includes(opt.value);
            const terkunci = !punya && !ktpOk && opt.butuhKtp;
            const active = punya || selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                disabled={punya}
                onClick={() => (terkunci ? keHalamanKtp() : toggle(opt.value))}
                className={`relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                  active
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 bg-white hover:border-primary-200'
                } ${punya ? 'cursor-default' : ''}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  active ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${active ? 'text-primary-700' : 'text-neutral-900'}`}>
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {punya ? 'Sudah kamu miliki' : terkunci ? 'Perlu verifikasi KTP' : opt.desc}
                  </p>
                </div>
                {terkunci ? (
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-neutral-400" />
                ) : (
                  active && (
                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                  )
                )}
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 text-center text-sm text-danger">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || selected.length === 0}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 py-3 font-medium text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              Lanjutkan
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}