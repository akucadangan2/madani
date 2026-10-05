import { createClient } from '@/lib/supabase/server';
import { setBagiHasil } from '@/lib/actions/bagi-hasil';

export default async function BagiHasilPage() {
  const supabase = await createClient();
  const { data: kecamatanList } = await supabase.from('kecamatan').select('*').order('nama');
  const { data: bagiHasilList } = await supabase.from('bagi_hasil_kecamatan').select('*');

  const bagiHasilMap = new Map<string, any>(
    (bagiHasilList ?? []).map((b: any) => [b.kecamatan_id, b] as [string, any])
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Pengaturan Bagi Hasil</h1>
      <p className="text-sm text-neutral-500">Total ketiga persentase harus 100%.</p>

      <div className="space-y-4 max-w-2xl">
        {kecamatanList?.map((k) => {
          const existing = bagiHasilMap.get(k.id);
          return (
            <form
              key={k.id}
              action={async (formData: FormData) => {
                'use server';
                await setBagiHasil(formData);
              }}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4"
            >
              <input type="hidden" name="kecamatan_id" value={k.id} />
              <span className="w-32 font-medium text-neutral-900">{k.nama}</span>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <label className="text-xs text-neutral-500">
                  Provider
                  <input
                    type="number"
                    name="persentase_provider"
                    min={0}
                    max={100}
                    defaultValue={existing?.persentase_provider ?? 10}
                    className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
                  />
                </label>
                <label className="text-xs text-neutral-500">
                  Pekerja/Penjual
                  <input
                    type="number"
                    name="persentase_pekerja_penjual"
                    min={0}
                    max={100}
                    defaultValue={existing?.persentase_pekerja_penjual ?? 80}
                    className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
                  />
                </label>
                <label className="text-xs text-neutral-500">
                  Kecamatan
                  <input
                    type="number"
                    name="persentase_kecamatan"
                    min={0}
                    max={100}
                    defaultValue={existing?.persentase_kecamatan ?? 10}
                    className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
                  />
                </label>
              </div>
              <button className="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white self-end">
                Simpan
              </button>
            </form>
          );
        })}
        {(!kecamatanList || kecamatanList.length === 0) && (
          <p className="text-neutral-400">Tambahkan kecamatan dulu di menu Wilayah.</p>
        )}
      </div>
    </div>
  );
}