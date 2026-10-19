'use client';

import { useState, useTransition } from 'react';
import { cabutAdmin } from '@/lib/actions/admin-akun';

export default function TombolCabut({ userId, nama }: { userId: string; nama: string }) {
  const [pending, mulai] = useTransition();
  const [galat, setGalat] = useState<string | null>(null);

  return (
    <span className="flex items-center gap-2">
      {galat && <span className="text-xs text-danger">{galat}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Cabut akses admin ${nama}?`)) return;
          setGalat(null);
          mulai(async () => {
            const r = await cabutAdmin(userId);
            if (!r.ok) setGalat(r.pesan);
          });
        }}
        className="text-xs text-danger disabled:opacity-60"
      >
        {pending ? 'Memproses...' : 'Cabut'}
      </button>
    </span>
  );
}