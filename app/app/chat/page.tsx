import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { waktuRelatif } from '@/lib/admin/data';
import AutoRefresh from './_components/auto-refresh';

export const dynamic = 'force-dynamic';

type Chat = {
  id: string;
  lawan_id: string;
  lawan_nama: string;
  konteks_label: string | null;
  last_message_at: string | null;
  pesan_terakhir: string | null;
  belum_dibaca: number | string;
};

export default async function ChatListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errMsg } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase.rpc('rpc_daftar_chat');
  const daftar = (data ?? []) as Chat[];

  return (
    <div className="mx-auto max-w-xl px-4 pb-6 pt-6">
      <AutoRefresh ms={8000} />
      <h1 className="font-display text-2xl font-bold">Chat</h1>

      {errMsg && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {errMsg}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {daftar.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <MessageCircle className="h-8 w-8 text-neutral-300" />
            <p className="mt-2 text-sm text-neutral-500">
              Belum ada percakapan. Mulai dari halaman pekerjaan atau produk lewat tombol Chat.
            </p>
          </div>
        )}

        {daftar.map((c) => {
          const belum = Number(c.belum_dibaca);
          return (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 hover:border-primary-300"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-50 font-semibold text-secondary-700">
                {(c.lawan_nama || '?').charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-neutral-900">{c.lawan_nama}</span>
                  {c.last_message_at && (
                    <span className="shrink-0 text-[11px] text-neutral-400">{waktuRelatif(c.last_message_at)}</span>
                  )}
                </span>
                {c.konteks_label && (
                  <span className="block truncate text-[11px] text-secondary-700">Tentang: {c.konteks_label}</span>
                )}
                <span className="flex items-center justify-between gap-2">
                  <span className={`truncate text-sm ${belum > 0 ? 'font-medium text-neutral-900' : 'text-neutral-500'}`}>
                    {c.pesan_terakhir ?? 'Belum ada pesan'}
                  </span>
                  {belum > 0 && (
                    <span className="shrink-0 rounded-full bg-primary-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                      {belum}
                    </span>
                  )}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}