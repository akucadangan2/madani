'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import PilihBank, { type BankRef } from './pilih-bank';

type Rincian = {
  jumlah: number;
  rincian: { nama: string; tipe: string; nilai: number; jumlah: number; kena_ppn: boolean }[];
  subtotal: number;
  ppn_persen: number;
  ppn: number;
  total_biaya: number;
  diterima: number;
  biaya_aktif: boolean;
  min_tarik: number;
  maks_tarik_harian: number | null;
  jadwal_cair: string | null;
  sla_hari_kerja: number;
  cutoff_jam: string;
};

const rp = (n: number) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');

function tglPanjang(s: string | null) {
  if (!s) return '-';
  return new Date(s + 'T12:00:00+07:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

function Kirim({ nonaktif }: { nonaktif: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending || nonaktif}
      className="w-full rounded-2xl bg-ink-900 py-3.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Mengirim...' : 'Ajukan penarikan'}
    </button>
  );
}

function Baris({ k, v, tebal, merah }: { k: string; v: string; tebal?: boolean; merah?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-3 py-1 text-sm ${tebal ? 'font-bold text-neutral-900' : 'text-neutral-700'}`}>
      <span>{k}</span>
      <span className={`whitespace-nowrap ${merah ? 'text-red-700' : ''}`}>{v}</span>
    </div>
  );
}

export default function FormTarik({
  saldo,
  namaDefault,
  bank,
  aksi,
}: {
  saldo: number;
  namaDefault: string;
  bank: BankRef[];
  aksi: (formData: FormData) => Promise<void>;
}) {
  const [teks, setTeks] = useState('');
  const [r, setR] = useState<Rincian | null>(null);
  const [gagalMuat, setGagalMuat] = useState(false);
  const [bankOk, setBankOk] = useState(false);
  const urut = useRef(0);
  const jumlah = Number(teks.replace(/\D/g, '')) || 0;

  useEffect(() => {
    const no = ++urut.current;
    const t = setTimeout(
      async () => {
        try {
          const sb = createClient();
          const { data, error } = await sb.rpc('app_rincian_penarikan', { p_jumlah: jumlah });
          if (no !== urut.current) return;
          if (error || !data) {
            setGagalMuat(true);
            return;
          }
          setGagalMuat(false);
          setR(data as Rincian);
        } catch {
          if (no === urut.current) setGagalMuat(true);
        }
      },
      jumlah === 0 ? 0 : 350
    );
    return () => clearTimeout(t);
  }, [jumlah]);

  const min = r?.min_tarik ?? 10000;
  const adaBiaya = !!r && r.biaya_aktif && r.total_biaya > 0;
  const terlaluKecil = jumlah > 0 && jumlah < min;
  const kelebihan = jumlah > saldo;
  const diterimaHabis = !!r && jumlah > 0 && r.diterima <= 0;
  const bisaKirim = jumlah >= min && !kelebihan && !diterimaHabis && bankOk;

  const input =
    'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-neutral-400';

  return (
    <form action={aksi} className="mt-6 space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">Jumlah (Rp)</label>
        <div className="relative">
          <input
            name="jumlah"
            inputMode="numeric"
            required
            autoComplete="off"
            value={teks}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, '').slice(0, 12);
              setTeks(d ? Number(d).toLocaleString('id-ID') : '');
            }}
            placeholder={`Minimal ${min.toLocaleString('id-ID')}`}
            className={input + ' pr-20'}
          />
          <button
            type="button"
            onClick={() => setTeks(Math.floor(saldo) > 0 ? Math.floor(saldo).toLocaleString('id-ID') : '')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold text-secondary-700 hover:bg-neutral-100"
          >
            Semua
          </button>
        </div>
        {terlaluKecil && <p className="mt-1.5 text-xs text-red-700">Minimal penarikan {rp(min)}</p>}
        {kelebihan && <p className="mt-1.5 text-xs text-red-700">Melebihi saldo kamu ({rp(saldo)})</p>}
        {diterimaHabis && <p className="mt-1.5 text-xs text-red-700">Jumlah terlalu kecil setelah dipotong biaya</p>}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Rincian penarikan</div>
        {jumlah >= min && r ? (
          <div className="mt-2 divide-y divide-neutral-200">
            <div className="pb-1">
              <Baris k="Jumlah penarikan" v={rp(jumlah)} />
              {adaBiaya &&
                r.rincian
                  .filter((x) => x.jumlah > 0)
                  .map((x) => <Baris key={x.nama} k={x.nama} v={'- ' + rp(x.jumlah)} merah />)}
              {adaBiaya && r.ppn > 0 && <Baris k={`PPN ${r.ppn_persen}%`} v={'- ' + rp(r.ppn)} merah />}
            </div>
            <div className="pt-1">
              {adaBiaya && <Baris k="Total potongan" v={'- ' + rp(r.total_biaya)} merah />}
              {!adaBiaya && <Baris k="Potongan biaya" v="Tidak ada" />}
              <Baris k="Dana yang kamu terima" v={rp(r.diterima)} tebal />
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-600">
            Ketik jumlah penarikan untuk melihat rincian potongan dan dana yang kamu terima.
          </p>
        )}
        {r?.jadwal_cair && (
          <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
            Estimasi dana masuk: <span className="font-semibold">{tglPanjang(r.jadwal_cair)}</span>
            <div className="mt-0.5 text-xs text-blue-800/80">
              Dihitung {r.sla_hari_kerja} hari kerja setelah pengajuan. Pengajuan setelah pukul {r.cutoff_jam} WIB,
              akhir pekan, dan hari libur dihitung hari kerja berikutnya.
            </div>
          </div>
        )}
        {gagalMuat && (
          <p className="mt-2 text-xs text-amber-700">
            Rincian belum bisa dimuat. Kamu tetap bisa mengajukan, potongan dihitung otomatis oleh sistem.
          </p>
        )}
      </div>

      <PilihBank bank={bank} onPilih={(b) => setBankOk(!!b)} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">Nomor rekening</label>
        <input name="bank_rekening" inputMode="numeric" required placeholder="Hanya angka" className={input} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">Atas nama</label>
        <input name="bank_atas_nama" required defaultValue={namaDefault} className={input} />
      </div>

      <Kirim nonaktif={!bisaKirim} />
    </form>
  );
}