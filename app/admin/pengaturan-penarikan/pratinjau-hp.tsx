'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Rincian = {
  jumlah: number;
  rincian: { nama: string; jumlah: number }[];
  ppn_persen: number;
  ppn: number;
  total_biaya: number;
  diterima: number;
  biaya_aktif: boolean;
  min_tarik: number;
  jadwal_cair: string | null;
  sla_hari_kerja: number;
  cutoff_jam: string;
};

const SALDO_CONTOH = 500000;
const rp = (n: number) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');

function tgl(s: string | null) {
  if (!s) return '-';
  return new Date(s + 'T12:00:00+07:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

function Baris({ k, v, tebal, merah }: { k: string; v: string; tebal?: boolean; merah?: boolean }) {
  return (
    <div
      className={`flex items-start justify-between gap-2 py-0.5 text-[12px] ${
        tebal ? 'font-extrabold text-neutral-900' : 'font-medium text-neutral-800'
      }`}
    >
      <span>{k}</span>
      <span className={`whitespace-nowrap ${merah ? 'text-red-600' : ''}`}>{v}</span>
    </div>
  );
}

export default function PratinjauHp({ biayaAktif }: { biayaAktif: boolean }) {
  const [teks, setTeks] = useState('100.000');
  const [r, setR] = useState<Rincian | null>(null);
  const [gagal, setGagal] = useState(false);
  const urut = useRef(0);
  const jumlah = Number(teks.replace(/\D/g, '')) || 0;

  useEffect(() => {
    const no = ++urut.current;
    const t = setTimeout(async () => {
      try {
        const { data, error } = await createClient().rpc('app_rincian_penarikan', { p_jumlah: jumlah });
        if (no !== urut.current) return;
        if (error || !data) {
          setGagal(true);
          return;
        }
        setGagal(false);
        setR(data as Rincian);
      } catch {
        if (no === urut.current) setGagal(true);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [jumlah]);

  const min = r?.min_tarik ?? 10000;
  const adaBiaya = !!r && r.biaya_aktif && r.total_biaya > 0;
  const tampil = !!r && jumlah >= min && jumlah <= SALDO_CONTOH;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold text-neutral-900">Pratinjau layar HP pengguna</div>
        <p className="mt-0.5 text-xs text-neutral-500">
          Persis seperti yang dilihat pengguna saat tarik dana. Ubah aturan, klik Simpan, lalu lihat hasilnya di sini.
          Nominal di layar ini hanya untuk mencoba.
        </p>
        <div
          className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            biayaAktif ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {biayaAktif ? 'Biaya potongan AKTIF' : 'Biaya potongan MATI: pengguna tidak dipotong'}
        </div>
      </div>

      <div className="mx-auto w-[300px] rounded-[2.4rem] border-[9px] border-neutral-900 bg-neutral-900 shadow-xl">
        <div className="relative overflow-hidden rounded-[1.8rem] bg-neutral-100">
          <div className="mx-auto mt-1.5 h-4 w-20 rounded-full bg-neutral-900" />
          <div className="px-3 pb-3 pt-4 text-[11px] text-neutral-400">
            <div className="rounded-t-2xl bg-white px-4 pb-4 pt-4 shadow">
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-neutral-300" />
              <div className="text-[17px] font-extrabold text-neutral-900">Tarik dana</div>
              <div className="mt-0.5 text-[12px] text-neutral-500">Tersedia {rp(SALDO_CONTOH)} (contoh)</div>

              <div className="mt-3 rounded-lg border border-neutral-300 px-2.5 pb-1.5 pt-1">
                <div className="text-[10px] text-neutral-500">Jumlah (Rp)</div>
                <div className="flex items-center gap-1">
                  <span className="text-[13px] text-neutral-500">Rp</span>
                  <input
                    value={teks}
                    inputMode="numeric"
                    aria-label="Nominal contoh"
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setTeks(d ? Number(d).toLocaleString('id-ID') : '');
                    }}
                    className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-neutral-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setTeks(SALDO_CONTOH.toLocaleString('id-ID'))}
                    className="text-[11px] font-semibold text-emerald-700"
                  >
                    Semua
                  </button>
                </div>
              </div>
              {jumlah > 0 && jumlah < min && (
                <div className="mt-1 text-[10.5px] text-red-600">Minimal penarikan {rp(min)}</div>
              )}

              <div className="mt-2.5 rounded-xl bg-neutral-100 p-2.5">
                <div className="text-[10px] font-bold text-neutral-500">Rincian penarikan</div>
                {tampil && r ? (
                  <div className="mt-1">
                    <Baris k="Jumlah penarikan" v={rp(jumlah)} />
                    {adaBiaya &&
                      r.rincian
                        .filter((x) => x.jumlah > 0)
                        .map((x) => <Baris key={x.nama} k={x.nama} v={'- ' + rp(x.jumlah)} merah />)}
                    {adaBiaya && r.ppn > 0 && <Baris k={`PPN ${r.ppn_persen}%`} v={'- ' + rp(r.ppn)} merah />}
                    <div className="my-1 border-t border-neutral-300" />
                    {adaBiaya ? (
                      <Baris k="Total potongan" v={'- ' + rp(r.total_biaya)} merah />
                    ) : (
                      <Baris k="Potongan biaya" v="Tidak ada" />
                    )}
                    <Baris k="Dana yang kamu terima" v={rp(r.diterima)} tebal />
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] leading-snug text-neutral-500">
                    Ketik jumlah penarikan untuk melihat rincian potongan dan dana yang kamu terima.
                  </p>
                )}
                {r?.jadwal_cair && (
                  <div className="mt-2 rounded-lg bg-emerald-100 p-2">
                    <div className="text-[10px] text-emerald-900">Estimasi dana masuk</div>
                    <div className="text-[12px] font-extrabold text-emerald-900">{tgl(r.jadwal_cair)}</div>
                    <div className="mt-0.5 text-[9.5px] leading-snug text-neutral-600">
                      Dihitung {r.sla_hari_kerja} hari kerja setelah pengajuan. Pengajuan setelah pukul {r.cutoff_jam}{' '}
                      WIB, akhir pekan, dan hari libur dihitung hari kerja berikutnya.
                    </div>
                  </div>
                )}
                {gagal && <p className="mt-1 text-[10px] text-amber-700">Pratinjau belum bisa dimuat.</p>}
              </div>

              <div className="mt-2.5 space-y-1.5">
                {['Nama bank', 'Nomor rekening', 'Atas nama'].map((x) => (
                  <div key={x} className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[11px] text-neutral-400">
                    {x}
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-full bg-emerald-600 py-2 text-center text-[12px] font-bold text-white">
                Ajukan pencairan
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}