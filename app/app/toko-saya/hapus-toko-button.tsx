'use client';

export default function HapusTokoButton({ nama }: { nama: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        const ya = window.confirm(
          `Hapus toko "${nama}"? Produknya akan disembunyikan dan toko tidak tampil lagi. Riwayat pesanan tetap tersimpan. Toko yang masih punya pesanan berjalan tidak bisa dihapus.`
        );
        if (!ya) e.preventDefault();
      }}
      className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
    >
      Hapus toko ini
    </button>
  );
}