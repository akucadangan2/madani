import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const JENIS: Record<string, string> = {
  sertifikat: 'Sertifikat',
  keahlian: 'Bukti keahlian',
  sim: 'SIM',
  lainnya: 'Lainnya',
};

type Dok = { id: string; jenis: string; judul: string; path: string };

export default async function DokumenPekerjaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ n?: string }>;
}) {
  const { id } = await params;
  const { n } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('dokumen_pekerja')
    .select('id, jenis, judul, path')
    .eq('user_id', id)
    .eq('tampil_publik', true)
    .order('created_at', { ascending: false });
  const dokumen = (data ?? []) as Dok[];

  const urlMap = new Map<string, string>();
  if (dokumen.length > 0) {
    const { data: signed } = await supabase.storage.from('dokumen-pekerja').createSignedUrls(
      dokumen.map((d) => d.path),
      600
    );
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) urlMap.set(s.path, s.signedUrl);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-6">
      <Link href="/cari-pekerja" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Cari pekerja
      </Link>
      <h1 className="mb-1 mt-3 font-display text-2xl font-bold">Sertifikat & dokumen</h1>
      <p className="mb-4 text-sm text-neutral-500">{n ? 'Milik ' + n : 'Dokumen pekerja'}</p>

      {dokumen.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
          Tidak ada dokumen yang dibuka untuk umum.
        </div>
      )}
      <div className="space-y-3">
        {dokumen.map((d) => {
          const url = urlMap.get(d.path);
          const pdf = d.path.toLowerCase().endsWith('.pdf');
          return (
            <div key={d.id} className="rounded-2xl border border-neutral-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary-600" />
                <p className="text-sm font-semibold text-neutral-900">{d.judul}</p>
                <span className="ml-auto text-xs text-neutral-500">{JENIS[d.jenis] ?? d.jenis}</span>
              </div>
              {url && !pdf && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={d.judul} className="mt-3 w-full rounded-xl border border-neutral-100" />
              )}
              {url && pdf && (
                <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-primary-600 hover:underline">
                  Buka PDF
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}