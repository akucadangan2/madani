import { createClient } from '@/lib/supabase/server';
import {
  createKategori,
  ubahKategori,
  hapusKategori,
  tambahSub,
  ubahSub,
  hapusSub,
} from '@/lib/actions/kategori';
import HapusKategoriButton, { HapusSubButton } from './hapus-button';

export const dynamic = 'force-dynamic';

type Kat = { id: string; nama: string; tipe: string; urutan: number | null };
type Pakai = { id: string; produk: number; lowongan: number; keahlian: number; sub: number };
type Sub = { id: string; kategori_id: string; nama: string; urutan: number | null };

function Kolom({
  judul,
  daftar,
  pakai,
  subMap,
  denganSub,
  buka,
}: {
  judul: string;
  daftar: Kat[];
  pakai: Map<string, Pakai>;
  subMap: Map<string, Sub[]>;
  denganSub: boolean;
  buka: string;
}) {
  return (
    <div>
      <h2 className="mb-2 font-medium text-secondary-700">{judul}</h2>
      <ul className="space-y-3 text-sm">
        {daftar.map((k) => {
          const p = pakai.get(k.id);
          const total = Number(p?.produk ?? 0) + Number(p?.lowongan ?? 0) + Number(p?.keahlian ?? 0);
          const subs = denganSub ? subMap.get(k.id) ?? [] : [];
          const lain = daftar.filter((x) => x.id !== k.id);
          return (
            <li key={k.id} className="space-y-2 rounded-xl border border-neutral-200 bg-white p-3">
              <form action={ubahKategori} className="flex gap-2">
                <input type="hidden" name="id" value={k.id} />
                <input
                  name="nama"
                  defaultValue={k.nama}
                  required
                  maxLength={80}
                  className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-1.5"
                />
                <button className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                  Simpan nama
                </button>
              </form>
              <p className="text-xs text-neutral-500">
                {total === 0
                  ? 'Belum dipakai'
                  : `Dipakai: ${p?.produk ?? 0} produk, ${p?.lowongan ?? 0} lowongan, ${p?.keahlian ?? 0} keahlian`}
              </p>

              {denganSub && (
                <details open={buka === k.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                  <summary className="cursor-pointer text-xs font-semibold text-neutral-700">
                    Sub kategori ({subs.length})
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {subs.map((s) => (
                      <li key={s.id} className="flex items-center gap-2">
                        <form action={ubahSub} className="flex min-w-0 flex-1 gap-2">
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="kategori_id" value={k.id} />
                          <input
                            name="nama"
                            defaultValue={s.nama}
                            required
                            maxLength={80}
                            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs"
                          />
                          <button className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100">
                            Simpan
                          </button>
                        </form>
                        <form action={hapusSub}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="kategori_id" value={k.id} />
                          <HapusSubButton nama={s.nama} />
                        </form>
                      </li>
                    ))}
                    {subs.length === 0 && <li className="text-xs text-neutral-400">Belum ada sub kategori</li>}
                  </ul>
                  <form action={tambahSub} className="mt-3 flex gap-2">
                    <input type="hidden" name="kategori_id" value={k.id} />
                    <input
                      name="nama"
                      required
                      maxLength={80}
                      placeholder="Sub kategori baru"
                      className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <button className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white">
                      Tambah
                    </button>
                  </form>
                </details>
              )}

              <form action={hapusKategori} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={k.id} />
                {(total > 0 || subs.length > 0) && (
                  <select
                    name="pindah_ke"
                    required={total > 0}
                    defaultValue=""
                    className="min-w-0 max-w-full flex-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-xs"
                  >
                    <option value="" disabled={total > 0}>
                      {total > 0 ? 'Pindahkan datanya ke...' : 'Pindahkan sub kategorinya ke... (opsional)'}
                    </option>
                    {lain.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.nama}
                      </option>
                    ))}
                  </select>
                )}
                <HapusKategoriButton nama={k.nama} pindah={total > 0} jumlahSub={subs.length} />
              </form>
            </li>
          );
        })}
        {daftar.length === 0 && <li className="text-neutral-400">Belum ada</li>}
      </ul>
    </div>
  );
}

export default async function KategoriPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; buka?: string }>;
}) {
  const { ok, error: errMsg, buka = '' } = await searchParams;
  const supabase = await createClient();
  const [{ data: kData }, { data: pData }, { data: sData }] = await Promise.all([
    supabase.from('kategori').select('*').order('tipe').order('urutan').order('nama'),
    supabase.rpc('rpc_admin_pakai_kategori'),
    supabase.from('kategori_sub').select('id,kategori_id,nama,urutan').order('urutan').order('nama'),
  ]);

  const semua = (kData ?? []) as Kat[];
  const pakai = new Map<string, Pakai>(((pData ?? []) as Pakai[]).map((p) => [p.id, p]));
  const subMap = new Map<string, Sub[]>();
  for (const s of (sData ?? []) as Sub[]) {
    const arr = subMap.get(s.kategori_id) ?? [];
    arr.push(s);
    subMap.set(s.kategori_id, arr);
  }
  const kerja = semua.filter((k) => k.tipe === 'kerja');
  const produk = semua.filter((k) => k.tipe === 'produk');

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-neutral-900">Kategori Kerja & Produk</h1>

      {ok && (
        <div className="max-w-3xl rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">{ok}</div>
      )}
      {errMsg && (
        <div className="max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{errMsg}</div>
      )}

      <form
        action={async (formData: FormData) => {
          'use server';
          await createKategori(formData);
        }}
        className="flex max-w-xl gap-2"
      >
        <input name="nama" required placeholder="Nama kategori" className="flex-1 rounded-lg border border-neutral-300 px-3 py-2" />
        <select name="tipe" className="rounded-lg border border-neutral-300 px-3 py-2">
          <option value="kerja">Kerja</option>
          <option value="produk">Produk</option>
        </select>
        <button className="rounded-lg bg-primary-500 px-4 py-2 text-white">Tambah</button>
      </form>

      <div className="grid max-w-5xl gap-6 md:grid-cols-2">
        <Kolom judul="Kategori Kerja" daftar={kerja} pakai={pakai} subMap={subMap} denganSub buka={buka} />
        <Kolom judul="Kategori Produk" daftar={produk} pakai={pakai} subMap={subMap} denganSub={false} buka={buka} />
      </div>
    </div>
  );
}