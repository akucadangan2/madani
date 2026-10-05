import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function KecamatanDashboardPage() {
  const current = await getCurrentUser();
  if (!current) return <div className="p-6">Silakan login</div>;

  const supabase = await createClient();

  const { data: profil } = await supabase.from('profiles').select('kecamatan_id').eq('id', current.id).single();
  const kecamatanId = profil?.kecamatan_id;

  if (!kecamatanId) {
    return <div className="p-6">Akun ini belum terhubung ke kecamatan manapun.</div>;
  }

  const { data: kecamatan } = await supabase.from('kecamatan').select('nama').eq('id', kecamatanId).single();

  const [{ count: totalWarga }, { count: totalToko }, { count: totalKerja }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('kecamatan_id', kecamatanId),
    supabase.from('toko').select('*', { count: 'exact', head: true }).eq('kecamatan_id', kecamatanId),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('kecamatan_id', kecamatanId),
  ]);

  const { data: bagiHasil } = await supabase
    .from('bagi_hasil_kecamatan').select('*').eq('kecamatan_id', kecamatanId).maybeSingle();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Dashboard {kecamatan?.nama}</h1>
        <p className="text-sm text-neutral-500">Tampilan read-only khusus kecamatan ini</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-neutral-200 p-4 text-center">
          <p className="text-2xl font-semibold text-neutral-900">{totalWarga ?? 0}</p>
          <p className="text-xs text-neutral-500">Warga Terdaftar</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 text-center">
          <p className="text-2xl font-semibold text-neutral-900">{totalToko ?? 0}</p>
          <p className="text-xs text-neutral-500">Toko</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 text-center">
          <p className="text-2xl font-semibold text-neutral-900">{totalKerja ?? 0}</p>
          <p className="text-xs text-neutral-500">Lowongan Kerja</p>
        </div>
      </div>

      {bagiHasil && (
        <div className="rounded-lg border border-neutral-200 p-4">
          <h2 className="font-medium text-neutral-900 mb-2">Porsi Bagi Hasil Kecamatan</h2>
          <p className="text-sm text-neutral-600">
            Kecamatan mendapat <span className="font-semibold text-primary-700">{bagiHasil.persentase_kecamatan}%</span> dari
            setiap transaksi yang selesai di wilayah ini.
          </p>
        </div>
      )}
    </div>
  );
}