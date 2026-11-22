'use client';

export default function TombolKonfirm({
  teks,
  konfirmasi,
  kelas,
}: {
  teks: string;
  konfirmasi: string;
  kelas: string;
}) {
  return (
    <button
      type="submit"
      className={kelas}
      onClick={(e) => {
        if (!window.confirm(konfirmasi)) e.preventDefault();
      }}
    >
      {teks}
    </button>
  );
}