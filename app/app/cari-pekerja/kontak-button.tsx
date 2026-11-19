'use client';

import { useTransition } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { hubungiPekerja } from '@/lib/actions/kontak-pekerja';

export default function KontakButton({
  pekerjaId,
  nama,
  biaya,
  gratis,
}: {
  pekerjaId: string;
  nama: string;
  biaya: number;
  gratis: boolean;
}) {
  const [sibuk, mulai] = useTransition();
  const bayar = biaya > 0 && !gratis;

  function klik() {
    if (
      bayar &&
      !window.confirm(
        `Hubungi ${nama}? Biaya kontak Rp ${biaya.toLocaleString('id-ID')} dipotong dari saldo kamu. Dibayar sekali untuk pekerja ini, setelah itu chat tanpa biaya.`
      )
    ) {
      return;
    }
    mulai(() => {
      void hubungiPekerja(pekerjaId, nama);
    });
  }

  return (
    <button
      type="button"
      onClick={klik}
      disabled={sibuk}
      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
    >
      {sibuk ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      Chat pekerja{bayar ? ` (Rp ${biaya.toLocaleString('id-ID')})` : ''}
    </button>
  );
}