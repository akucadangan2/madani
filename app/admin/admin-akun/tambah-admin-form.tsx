'use client';

import { useActionState } from 'react';
import { tambahAdmin, type HasilAdmin } from '@/lib/actions/admin-akun';

export default function TambahAdminForm() {
  const [state, aksi, pending] = useActionState<HasilAdmin | null, FormData>(tambahAdmin, null);

  return (
    <div className="space-y-2">
      <form action={aksi} className="flex max-w-2xl flex-wrap gap-2">
        <input
          name="nama"
          required
          placeholder="Nama lengkap"
          className="min-w-[180px] flex-1 rounded-lg border border-neutral-300 px-3 py-2"
        />
        <input
          name="hp"
          required
          inputMode="tel"
          placeholder="Nomor HP, contoh 08123456789"
          className="min-w-[220px] flex-1 rounded-lg border border-neutral-300 px-3 py-2"
        />
        <button
          disabled={pending}
          className="rounded-lg bg-primary-500 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? 'Menyimpan...' : 'Tambah admin'}
        </button>
      </form>
      {state && (
        <p className={state.ok ? 'text-sm text-green-700' : 'text-sm text-danger'}>{state.pesan}</p>
      )}
    </div>
  );
}