'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createKategori(formData: FormData) {
  const nama = formData.get('nama') as string;
  const tipe = formData.get('tipe') as string;

  const supabase = await createClient();
  const { error } = await supabase.from('kategori').insert({ nama, tipe });
  if (error) return { error: error.message };

  revalidatePath('/admin/kategori');
  return { success: true };
}

export async function deleteKategori(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('kategori').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/kategori');
  return { success: true };
}