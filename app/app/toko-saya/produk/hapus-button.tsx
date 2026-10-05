'use client';

export default function HapusButton({ nama }: { nama: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        const ya = window.confirm(
          `Hapus produk "${nama}"? Kalau sudah pernah dipesan, produk hanya disembunyikan.`
        );
        if (!ya) e.preventDefault();
      }}
      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
    >
      Hapus
    </button>
  );
}