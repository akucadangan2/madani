'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function setBagiHasil(formData: FormData) {
  const kecamatanId = formData.get('kecamatan_id') as string;
  const provider = Number(formData.get('persentase_provider'));
  const pekerjaPenjual = Number(formData.get('persentase_pekerja_penjual'));
  const kecamatan = Number(formData.get('persentase_kecamatan'));

  if (provider + pekerjaPenjual + kecamatan !== 100) {
    return { error: 'Total persentase harus 100%' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('bagi_hasil_kecamatan').upsert({
    kecamatan_id: kecamatanId,
    persentase_provider: provider,
    persentase_pekerja_penjual: pekerjaPenjual,
    persentase_kecamatan: kecamatan,
  });
  if (error) return { error: error.message };

  revalidatePath('/admin/bagi-hasil');
  return { success: true };
}