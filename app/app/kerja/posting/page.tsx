import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { PostingForm } from './posting-form';

export default async function PostingKerjaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data: kategoriList } = await supabase
    .from('kategori')
    .select('id, nama')
    .eq('tipe', 'kerja')
    .order('urutan');

  return <PostingForm kategoriList={kategoriList ?? []} />;
}