import { MessageCircle } from 'lucide-react';
import { mulaiChat } from '@/lib/actions/chat';

export default function ChatButton({
  lawanId,
  label,
  href,
  teks,
  kecil,
}: {
  lawanId: string;
  label: string;
  href: string;
  teks: string;
  kecil?: boolean;
}) {
  return (
    <form action={mulaiChat.bind(null, lawanId, label, href)}>
      <button
        type="submit"
        className={
          kecil
            ? 'inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50'
            : 'flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50'
        }
      >
        <MessageCircle className="h-4 w-4" /> {teks}
      </button>
    </form>
  );
}