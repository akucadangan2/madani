import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { tambahKecamatanDariDaftar } from '@/lib/actions/admin-kelola';

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
  redirect('/admin/wilayah?ok=' + encodeURIComponent('Kecamatan ditambahkan'));
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
  redirect('/admin/wilayah?ok=' + encodeURIComponent('Kecamatan dihapus'));
}

type Ref = { kode: string; nama: string; kabupaten: string | null; provinsi: string | null };

export default async function WilayahPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; cari?: string; q?: string }>;
}) {
  const { error: errorMsg, cari = '', q = '' } = await searchParams;
  const supabase = await createClient();

  // Kecamatan yang sudah terdaftar (bisa disaring)
  let daftar = supabase.from('kecamatan').select('*').order('nama');
  const kataQ = q.replace(/[,()%*]/g, ' ').trim();
  if (kataQ) daftar = daftar.or(`nama.ilike.%${kataQ}%,kabupaten.ilike.%${kataQ}%,provinsi.ilike.%${kataQ}%`);
  const { data: kecamatanList } = await daftar;

  // Pencarian di daftar wilayah resmi
  const tokens = cari
    .replace(/[,()%*]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);
  let hasil: Ref[] = [];
  const sudahAda = new Set<string>();
  if (tokens.length > 0) {
    let rq = supabase.from('wilayah_ref').select('kode, nama, kabupaten, provinsi').order('nama').limit(40);
    for (const kata of tokens) {
      rq = rq.or(`nama.ilike.%${kata}%,kabupaten.ilike.%${kata}%,provinsi.ilike.%${kata}%`);
    }
    const { data } = await rq;
    hasil = (data ?? []) as Ref[];
    if (hasil.length > 0) {
      const { data: ada } = await supabase
        .from('kecamatan')
        .select('kode')
        .in('kode', hasil.map((h) => h.kode));
      (ada ?? []).forEach((a: { kode: string | null }) => a.kode && sudahAda.add(a.kode));
    }
  }

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

      {/* Cari dan tambah dari daftar wilayah resmi */}
      <section className="max-w-3xl space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div>
          <h2 className="font-semibold text-neutral-900">Tambah kecamatan dari daftar wilayah</h2>
          <p className="text-sm text-neutral-500">
            Ketik nama kecamatan, kabupaten, atau provinsi. Contoh: &quot;sukarame lampung&quot;.
          </p>
        </div>
        <form action="/admin/wilayah" className="relative">
          {q && <input type="hidden" name="q" value={q} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            name="cari"
            defaultValue={cari}
            placeholder="Cari kecamatan di seluruh Indonesia..."
            className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm"
          />
        </form>

        {tokens.length > 0 && hasil.length === 0 && (
          <p className="text-sm text-neutral-500">Tidak ada wilayah yang cocok dengan &quot;{cari}&quot;.</p>
        )}

        {hasil.length > 0 && (
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {hasil.map((h) => (
              <li key={h.kode} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">{h.nama}</div>
                  <div className="text-xs text-neutral-500">
                    {h.kabupaten ?? '-'}, {h.provinsi ?? '-'}
                  </div>
                </div>
                {sudahAda.has(h.kode) ? (
                  <span className="text-xs text-neutral-400">Sudah terdaftar</span>
                ) : (
                  <form action={tambahKecamatanDariDaftar}>
                    <input type="hidden" name="kode" value={h.kode} />
                    <input type="hidden" name="cari" value={cari} />
                    <button className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs text-white">Tambah</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {hasil.length === 40 && (
          <p className="text-xs text-neutral-400">Menampilkan 40 hasil pertama. Tambahkan kata kunci untuk mempersempit.</p>
        )}
      </section>

      {/* Tambah manual (cadangan) */}
      <details className="max-w-3xl rounded-2xl border border-neutral-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-700">
          Wilayah tidak ada di daftar? Tambah manual
        </summary>
        <form action={tambahKecamatan} className="mt-3 flex flex-wrap gap-2">
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
      </details>

      {/* Daftar yang sudah terdaftar */}
      <div className="max-w-3xl space-y-3">
        <form action="/admin/wilayah" className="relative">
          {cari && <input type="hidden" name="cari" value={cari} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Saring kecamatan terdaftar..."
            className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm sm:w-72"
          />
        </form>

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Kecamatan</th>
                <th className="px-4 py-3">Kabupaten / Provinsi</th>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {kecamatanList?.map((k: any) => (
                <tr key={k.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-neutral-900">{k.nama}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {[k.kabupaten, k.provinsi].filter(Boolean).join(', ') || k.alamat || '-'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{k.kode ?? '-'}</td>
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
                    {q ? `Tidak ada kecamatan terdaftar untuk "${q}".` : 'Belum ada kecamatan. Cari dan tambahkan lewat kolom di atas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}