'use client';

import { useEffect, useState } from 'react';

const SEL = 'input[name="ids"][form="batch"]';

function kotak() {
  return Array.from(document.querySelectorAll<HTMLInputElement>(SEL));
}

export function PilihSemua() {
  const [n, setN] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const hitung = () => {
      const k = kotak();
      setTotal(k.length);
      setN(k.filter((x) => x.checked).length);
    };
    hitung();
    document.addEventListener('change', hitung);
    return () => document.removeEventListener('change', hitung);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          const k = kotak();
          const semua = k.length > 0 && k.every((x) => x.checked);
          k.forEach((x) => {
            x.checked = !semua;
          });
          document.dispatchEvent(new Event('change'));
        }}
        className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
      >
        {total > 0 && n === total ? 'Batal pilih semua' : 'Pilih semua di halaman'}
      </button>
      <span className="text-sm font-medium text-neutral-700">{n} dipilih</span>
    </div>
  );
}

export function TombolAksi({
  aksi,
  teks,
  konfirmasi,
  kelas,
}: {
  aksi: string;
  teks: string;
  konfirmasi: string;
  kelas: string;
}) {
  return (
    <button
      type="submit"
      name="aksi"
      value={aksi}
      className={kelas}
      onClick={(e) => {
        const n = kotak().filter((x) => x.checked).length;
        if (n === 0) {
          e.preventDefault();
          window.alert('Centang minimal satu permintaan.');
          return;
        }
        if (!window.confirm(`${konfirmasi} (${n} permintaan)?`)) e.preventDefault();
      }}
    >
      {teks}
    </button>
  );
}