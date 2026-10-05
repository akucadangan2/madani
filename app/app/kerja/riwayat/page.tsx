import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function RiwayatKerjaPage() {
  const current = await getCurrentUser();
  if (!current) return <div className="p-6">Silakan login</div>;

  const supabase = await createClient();
  const { data: sebagaiPemberi } = await supabase
    .from('tasks').select('*').eq('pemberi_kerja_id', current.id).order('created_at', { ascending: false });
  const { data: lamaranSaya } = await supabase
    .from('lamaran_kerja').select('*, tasks(*)').eq('pencari_kerja_id', current.id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Riwayat Kerja</h1>
      <div>
        <h2 className="font-medium text-neutral-700 mb-2">Kerja yang Saya Posting</h2>
        <div className="space-y-2">
          {sebagaiPemberi?.map((t) => (
            <Link key={t.id} href={`/kerja/${t.id}`} className="block rounded-lg border border-neutral-200 p-3 text-sm">
              {t.judul} — <span className="text-neutral-400">{t.status}</span>
            </Link>
          ))}
          {(!sebagaiPemberi || sebagaiPemberi.length === 0) && <p className="text-neutral-400 text-sm">Belum ada</p>}
        </div>
      </div>
      <div>
        <h2 className="font-medium text-neutral-700 mb-2">Lamaran Saya</h2>
        <div className="space-y-2">
          {lamaranSaya?.map((l) => (
            <Link key={l.id} href={`/kerja/${l.tasks.id}`} className="block rounded-lg border border-neutral-200 p-3 text-sm">
              {l.tasks.judul} — <span className="text-neutral-400">{l.status}</span>
            </Link>
          ))}
          {(!lamaranSaya || lamaranSaya.length === 0) && <p className="text-neutral-400 text-sm">Belum ada</p>}
        </div>
      </div>
    </div>
  );
}