'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'danger' | 'ghost';

const STYLE: Record<Variant, string> = {
  primary: 'bg-green-600 text-white hover:bg-green-700',
  danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
  ghost: 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50',
};

export default function ActionButton({
  action,
  fields,
  children,
  variant = 'primary',
  confirmText,
  promptLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  children: React.ReactNode;
  variant?: Variant;
  confirmText?: string;
  /** Kalau diisi, muncul kotak isian; hasilnya dikirim sebagai field "catatan". */
  promptLabel?: string;
}) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (pending) return;
    if (confirmText && !window.confirm(confirmText)) return;

    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));

    if (promptLabel) {
      const jawaban = window.prompt(promptLabel);
      if (jawaban === null) return; // dibatalkan
      fd.append('catatan', jawaban.trim());
    }

    setPending(true);
    try {
      await action(fd);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${STYLE[variant]}`}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}