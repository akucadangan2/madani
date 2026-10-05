import { createClient } from '@/lib/supabase/server';
import { createKategori, deleteKategori } from '@/lib/actions/kategori';

export default async function KategoriPage() {
  const supabase = await createClient();
  const { data: kategoriList } = await supabase.from('kategori').select('*').order('tipe').order('nama');

  const kerja = kategoriList?.filter((k) => k.tipe === 'kerja') ?? [];
  const produk = kategoriList?.filter((k) => k.tipe === 'produk') ?? [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Kategori Kerja & Produk</h1>

      <form
        action={async (formData: FormData) => {
          'use server';
          await createKategori(formData);
        }}
        className="flex gap-2 max-w-xl"
      >
        <input name="nama" required placeholder="Nama kategori"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2" />
        <select name="tipe" className="rounded-lg border border-neutral-300 px-3 py-2">
          <option value="kerja">Kerja</option>
          <option value="produk">Produk</option>
        </select>
        <button className="rounded-lg bg-primary-500 px-4 py-2 text-white">Tambah</button>
      </form>

      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        <div>
          <h2 className="mb-2 font-medium text-secondary-700">Kategori Kerja</h2>
          <ul className="space-y-1 text-sm">
            {kerja.map((k) => (
              <li key={k.id} className="flex justify-between border-b border-neutral-100 py-2">
                {k.nama}
                <form
                  action={async () => {
                    'use server';
                    await deleteKategori(k.id);
                  }}
                >
                  <button className="text-danger text-xs">Hapus</button>
                </form>
              </li>
            ))}
            {kerja.length === 0 && <li className="text-neutral-400">Belum ada</li>}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 font-medium text-secondary-700">Kategori Produk</h2>
          <ul className="space-y-1 text-sm">
            {produk.map((k) => (
              <li key={k.id} className="flex justify-between border-b border-neutral-100 py-2">
                {k.nama}
                <form
                  action={async () => {
                    'use server';
                    await deleteKategori(k.id);
                  }}
                >
                  <button className="text-danger text-xs">Hapus</button>
                </form>
              </li>
            ))}
            {produk.length === 0 && <li className="text-neutral-400">Belum ada</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}