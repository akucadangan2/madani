'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';

export default function KirimForm({ kirim }: { kirim: (fd: FormData) => Promise<{ error?: string }> }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sibuk) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!String(fd.get('isi') ?? '').trim()) return;

    setSibuk(true);
    setErr(null);
    const res = await kirim(fd);
    setSibuk(false);

    if (res.error) {
      setErr(res.error);
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="sticky bottom-24 mt-4">
      {err && <p className="mb-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">{err}</p>}
      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1.5 shadow-sm">
        <input
          name="isi"
          required
          maxLength={2000}
          autoComplete="off"
          placeholder="Tulis pesan..."
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={sibuk}
          aria-label="Kirim"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}