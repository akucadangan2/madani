import { createClient } from '@/lib/supabase/server';
import { rupiah, waktuRelatif } from '@/lib/admin/data';
import StatusBadge from '../_components/StatusBadge';

type TrxRow = {
  id: string;
  tipe: string;
  kecamatan_id: string | null;
  jumlah_total: number | string;
  status: string;
  payment_gateway: string | null;
  payment_ref: string | null;
  created_at: string;
};

export default async function AdminTransaksi() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transaksi')
    .select('id, tipe, kecamatan_id, jumlah_total, status, payment_gateway, payment_ref, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const rows = (data ?? []) as TrxRow[];

  const kecIds = Array.from(new Set(rows.map((r) => r.kecamatan_id).filter((x): x is string => !!x)));
  const { data: kecs } = kecIds.length
    ? await supabase.from('kecamatan').select('id, nama').in('id', kecIds)
    : { data: [] as { id: string; nama: string }[] };
  const namaKec = new Map(((kecs ?? []) as { id: string; nama: string }[]).map((k) => [k.id, k.nama]));

  const total = rows.reduce((s, r) => s + Number(r.jumlah_total || 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Transaksi</h1>
        <p className="mt-1 text-sm text-neutral-600">100 transaksi terbaru.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-2xl font-bold text-neutral-900">{rows.length}</div>
          <div className="text-sm text-neutral-600">Transaksi</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-2xl font-bold text-neutral-900">{rupiah(total)}</div>
          <div className="text-sm text-neutral-600">Total nilai</div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Gagal memuat: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Waktu</th>
              <th className="px-4 py-3 font-medium">Tipe</th>
              <th className="px-4 py-3 font-medium">Kecamatan</th>
              <th className="px-4 py-3 text-right font-medium">Jumlah</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Gateway / Ref</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{waktuRelatif(r.created_at)}</td>
                <td className="px-4 py-3">{r.tipe}</td>
                <td className="px-4 py-3">{r.kecamatan_id ? namaKec.get(r.kecamatan_id) ?? '-' : '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{rupiah(r.jumlah_total)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {r.payment_gateway ?? '-'}
                  {r.payment_ref ? ` / ${r.payment_ref}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}