import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { PostingForm } from './posting-form';

export default async function PostingKerjaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const [{ data: kategoriList }, { data: kecamatanList }] = await Promise.all([
    supabase.from('kategori').select('id, nama').order('nama'),
    supabase.from('kecamatan').select('id, nama').order('nama'),
  ]);

  return (
    <PostingForm
      kategoriList={kategoriList ?? []}
      kecamatanList={kecamatanList ?? []}
    />
  );
}