import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { kirimPesan } from '@/lib/actions/chat';
import AutoRefresh from '../_components/auto-refresh';
import ScrollBawah from '../_components/scroll-bawah';
import KirimForm from '../_components/kirim-form';

export const dynamic = 'force-dynamic';

type Info = {
  lawan_id: string;
  lawan_nama: string;
  konteks_label: string | null;
  konteks_href: string | null;
};
type Pesan = {
  id: string;
  pengirim_id: string;
  isi: string;
  created_at: string;
  dibaca_at: string | null;
};

function jam(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: infoData } = await supabase.rpc('rpc_info_chat', { p_percakapan_id: id });
  const lawan = ((infoData ?? []) as Info[])[0];
  if (!lawan) notFound();

  await supabase.rpc('rpc_tandai_dibaca', { p_percakapan_id: id });

  const { data: pData } = await supabase
    .from('pesan')
    .select('id, pengirim_id, isi, created_at, dibaca_at')
    .eq('percakapan_id', id)
    .order('created_at', { ascending: false })
    .limit(200);
  const pesan = ((pData ?? []) as Pesan[]).slice().reverse();

  return (
    <div className="mx-auto max-w-xl px-4 pb-4 pt-4">
      <AutoRefresh ms={5000} />
      <ScrollBawah n={pesan.length} />

      <div className="sticky top-0 z-10 -mx-4 border-b border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/chat" aria-label="Kembali" className="text-neutral-600 hover:text-neutral-900">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-50 text-sm font-semibold text-secondary-700">
            {(lawan.lawan_nama || '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-neutral-900">{lawan.lawan_nama}</div>
            {lawan.konteks_label &&
              (lawan.konteks_href ? (
                <Link href={lawan.konteks_href} className="block truncate text-xs text-secondary-700 underline">
                  Tentang: {lawan.konteks_label}
                </Link>
              ) : (
                <span className="block truncate text-xs text-neutral-500">Tentang: {lawan.konteks_label}</span>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {pesan.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-400">Belum ada pesan. Mulai percakapan di bawah.</p>
        )}

        {pesan.map((m) => {
          const saya = m.pengirim_id === user.id;
          return (
            <div key={m.id} className={`flex ${saya ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  saya ? 'rounded-br-md bg-ink-900 text-white' : 'rounded-bl-md bg-neutral-100 text-neutral-900'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.isi}</p>
                <p className={`mt-0.5 text-right text-[10px] ${saya ? 'text-white/60' : 'text-neutral-400'}`}>
                  {jam(m.created_at)}
                  {saya && m.dibaca_at ? ' - Dibaca' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <KirimForm kirim={kirimPesan.bind(null, id)} />
    </div>
  );
}