import { Download } from 'lucide-react';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=id.rhgteknologi.madani';

export default function TombolPlayStore({
  ukuran = 'besar',
  className = '',
}: {
  ukuran?: 'besar' | 'kecil';
  className?: string;
}) {
  const dasar =
    'items-center justify-center gap-2 rounded-full bg-secondary-700 font-semibold text-white transition hover:opacity-90';
  const gaya =
    ukuran === 'kecil'
      ? 'hidden md:inline-flex px-4 py-2 text-[15px]'
      : 'inline-flex w-full px-7 py-3.5 sm:w-auto';
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`${dasar} ${gaya} ${className}`}
    >
      <Download className="h-4 w-4" />
      Unduh di Google Play
    </a>
  );
}