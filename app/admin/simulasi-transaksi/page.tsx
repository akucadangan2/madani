import SimulasiTransaksi from './simulasi-transaksi';

export default function SimulasiTransaksiPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Simulasi Transaksi</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Hitung arus uang satu transaksi dari pembeli sampai rekening penjual, lengkap dengan biaya DOKU, bagi hasil,
          dan untung bersih platform. Angka di sini hanya simulasi dan tidak mengubah data apa pun.
        </p>
      </div>
      <SimulasiTransaksi />
    </div>
  );
}