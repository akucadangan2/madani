import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function tambahKecamatan(formData: FormData) {
  'use server';
  const nama = (formData.get('nama') as string)?.trim();
  const kode = (formData.get('kode') as string)?.trim() || null;
  const alamat = (formData.get('alamat') as string)?.trim() || null;

  if (!nama) {
    redirect('/admin/wilayah?error=' + encodeURIComponent('Nama kecamatan wajib diisi'));
  }

  const supabase = await createClient();
  const { error } = await supabase.from('kecamatan').insert({ nama, kode, alamat });

  if (error) {
    redirect('/admin/wilayah?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/admin/wilayah');
  redirect('/admin/wilayah');
}

async function hapusKecamatan(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from('kecamatan').delete().eq('id', id);

  if (error) {
    const pesan =
      error.code === '23503'
        ? 'Kecamatan ini masih dipakai (toko/user/bagi hasil) dan tidak bisa dihapus'
        : error.message;
    redirect('/admin/wilayah?error=' + encodeURIComponent(pesan));
  }

  revalidatePath('/admin/wilayah');
  redirect('/admin/wilayah');
}

export default async function WilayahPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMsg } = await searchParams;
  const supabase = await createClient();
  const { data: kecamatanList } = await supabase.from('kecamatan').select('*').order('nama');

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Master Wilayah Kecamatan</h1>
        <p className="text-sm text-neutral-500">{kecamatanList?.length ?? 0} kecamatan terdaftar</p>
      </div>

      {errorMsg && (
        <div className="max-w-3xl rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <form action={tambahKecamatan} className="flex max-w-3xl flex-wrap gap-2">
        <input
          name="nama"
          required
          placeholder="Nama kecamatan"
          className="min-w-[180px] flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          name="kode"
          placeholder="Kode (opsional)"
          className="w-36 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          name="alamat"
          placeholder="Alamat (opsional)"
          className="min-w-[200px] flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white">Tambah</button>
      </form>

      <div className="max-w-3xl overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Alamat</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {kecamatanList?.map((k: any) => (
              <tr key={k.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium text-neutral-900">{k.nama}</td>
                <td className="px-4 py-3 text-neutral-600">{k.kode ?? '-'}</td>
                <td className="px-4 py-3 text-neutral-600">{k.alamat ?? '-'}</td>
                <td className="px-4 py-3 text-right">
                  <form action={hapusKecamatan}>
                    <input type="hidden" name="id" value={k.id} />
                    <button className="text-xs text-danger hover:underline">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
            {(!kecamatanList || kecamatanList.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                  Belum ada kecamatan. Tambahkan lewat form di atas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}