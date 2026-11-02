'use client';

export default function HapusKategoriButton({
  nama,
  pindah,
  jumlahSub = 0,
}: {
  nama: string;
  pindah: boolean;
  jumlahSub?: number;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        const pesan = pindah
          ? `Hapus kategori "${nama}"? Semua data yang memakainya akan dipindahkan ke kategori tujuan yang dipilih.`
          : jumlahSub > 0
            ? `Hapus kategori "${nama}"? ${jumlahSub} sub kategorinya ikut terhapus, kecuali kamu memilih kategori tujuan.`
            : `Hapus kategori "${nama}"?`;
        if (!window.confirm(pesan)) e.preventDefault();
      }}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
    >
      Hapus
    </button>
  );
}

export function HapusSubButton({ nama }: { nama: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        const ya = window.confirm(
          `Hapus sub kategori "${nama}"? Keahlian yang sudah dipilih pekerja tidak ikut terhapus.`
        );
        if (!ya) e.preventDefault();
      }}
      className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
    >
      Hapus
    </button>
  );
}