'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type BankRef = {
  kode: string;
  nama: string;
  nama_tampil: string;
  alias: string | null;
  populer: boolean;
};

export default function PilihBank({
  bank,
  onPilih,
}: {
  bank: BankRef[];
  onPilih?: (b: BankRef | null) => void;
}) {
  const [buka, setBuka] = useState(false);
  const [q, setQ] = useState('');
  const [dipilih, setDipilih] = useState<BankRef | null>(null);
  const kotak = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;
    const tutup = (e: MouseEvent) => {
      if (kotak.current && !kotak.current.contains(e.target as Node)) setBuka(false);
    };
    document.addEventListener('mousedown', tutup);
    return () => document.removeEventListener('mousedown', tutup);
  }, [buka]);

  const hasil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    if (!kata) return bank;
    return bank.filter((b) =>
      `${b.nama_tampil} ${b.nama} ${b.alias ?? ''} ${b.kode}`.toLowerCase().includes(kata)
    );
  }, [bank, q]);

  const populer = !q.trim() ? hasil.filter((b) => b.populer) : [];
  const lain = !q.trim() ? hasil.filter((b) => !b.populer) : hasil;

  function pilih(b: BankRef) {
    setDipilih(b);
    onPilih?.(b);
    setBuka(false);
    setQ('');
  }

  const Item = ({ b }: { b: BankRef }) => (
    <li>
      <button
        type="button"
        onClick={() => pilih(b)}
        className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-neutral-50 ${
          dipilih?.kode === b.kode ? 'bg-neutral-50 font-semibold' : ''
        }`}
      >
        <span>
          <span className="block text-neutral-900">{b.nama_tampil}</span>
          {b.nama_tampil !== b.nama && <span className="block text-xs text-neutral-500">{b.nama}</span>}
        </span>
        <span className="text-xs text-neutral-400">{b.kode}</span>
      </button>
    </li>
  );

  return (
    <div ref={kotak} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-neutral-800">Bank / e-wallet</label>
      <input type="hidden" name="bank_kode" value={dipilih?.kode ?? ''} />
      <input type="hidden" name="bank_nama" value={dipilih?.nama_tampil ?? ''} />
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-left text-sm outline-none hover:border-neutral-300"
      >
        <span className={dipilih ? 'font-medium text-neutral-900' : 'text-neutral-400'}>
          {dipilih ? dipilih.nama_tampil : 'Pilih bank'}
        </span>
        <span className="text-neutral-400">{buka ? '▲' : '▼'}</span>
      </button>

      {buka && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <div className="border-b border-neutral-100 p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari bank, mis. BRI atau mandiri"
              className="w-full rounded-lg bg-neutral-100 px-3 py-2 text-sm outline-none"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {populer.length > 0 && (
              <>
                <li className="px-3.5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Populer</li>
                {populer.map((b) => (
                  <Item key={b.kode} b={b} />
                ))}
                <li className="px-3.5 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Semua bank</li>
              </>
            )}
            {lain.map((b) => (
              <Item key={b.kode} b={b} />
            ))}
            {hasil.length === 0 && <li className="px-3.5 py-4 text-sm text-neutral-500">Bank tidak ditemukan.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}