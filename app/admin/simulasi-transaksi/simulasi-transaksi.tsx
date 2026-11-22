'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Penanggung = 'pembeli' | 'platform' | 'penjual';

type Tarik = {
  jumlah: number;
  rincian: { nama: string; jumlah: number }[];
  ppn_persen: number;
  ppn: number;
  total_biaya: number;
  diterima: number;
  biaya_aktif: boolean;
  min_tarik: number;
  jadwal_cair: string | null;
};

const rp = (n: number) => (n < 0 ? '-Rp ' : 'Rp ') + Math.abs(Math.round(n)).toLocaleString('id-ID');
const digit = (s: string) => Number(s.replace(/\D/g, '')) || 0;
const des = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

function tgl(s: string | null) {
  if (!s) return '';
  return new Date(s + 'T12:00:00+07:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  });
}

const kotak = 'w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm';
const label = 'mb-1 block text-xs font-medium text-neutral-600';

function Baris({ k, v, tebal, warna }: { k: string; v: string; tebal?: boolean; warna?: string }) {
  return (
    <div className={`flex items-start justify-between gap-3 py-1 text-sm ${tebal ? 'font-bold' : ''} ${warna ?? 'text-neutral-800'}`}>
      <span>{k}</span>
      <span className="whitespace-nowrap">{v}</span>
    </div>
  );
}

function Langkah({ no, judul, children }: { no: number; judul: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">{no}</span>
        <span className="text-sm font-semibold text-neutral-900">{judul}</span>
      </div>
      {children}
    </div>
  );
}

export default function SimulasiTransaksi() {
  const [nominal, setNominal] = useState('100.000');
  const [dokuFlat, setDokuFlat] = useState('1000');
  const [dokuPersen, setDokuPersen] = useState('0');
  const [dokuPpn, setDokuPpn] = useState('11');
  const [dokuKenaPpn, setDokuKenaPpn] = useState(true);
  const [penanggung, setPenanggung] = useState<Penanggung>('platform');
  const [komisiPersen, setKomisiPersen] = useState('10');
  const [komisiFlat, setKomisiFlat] = useState('0');
  const [biayaBank, setBiayaBank] = useState('0');
  const [perBulan, setPerBulan] = useState('100');

  const h = useMemo(() => {
    const N = digit(nominal);
    const F = Math.round(des(dokuFlat) + (N * des(dokuPersen)) / 100);
    const ppnF = dokuKenaPpn ? Math.round((F * des(dokuPpn)) / 100) : 0;
    const FT = F + ppnF;
    const K = Math.min(N, Math.round((N * des(komisiPersen)) / 100 + des(komisiFlat)));
    const bayarPembeli = N + (penanggung === 'pembeli' ? FT : 0);
    const settlement = bayarPembeli - FT;
    const bagianPenjual = Math.max(0, N - K - (penanggung === 'penjual' ? FT : 0));
    const tertahan = settlement - bagianPenjual;
    return { N, F, ppnF, FT, K, bayarPembeli, settlement, bagianPenjual, tertahan };
  }, [nominal, dokuFlat, dokuPersen, dokuPpn, dokuKenaPpn, penanggung, komisiPersen, komisiFlat]);

  const [tarik, setTarik] = useState<Tarik | null>(null);
  const [gagal, setGagal] = useState(false);
  const urut = useRef(0);

  useEffect(() => {
    const no = ++urut.current;
    const t = setTimeout(async () => {
      try {
        const { data, error } = await createClient().rpc('app_rincian_penarikan', { p_jumlah: h.bagianPenjual });
        if (no !== urut.current) return;
        if (error || !data) {
          setGagal(true);
          return;
        }
        setGagal(false);
        setTarik(data as Tarik);
      } catch {
        if (no === urut.current) setGagal(true);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [h.bagianPenjual]);

  const bisaTarik = !!tarik && h.bagianPenjual >= tarik.min_tarik;
  const biayaTarik = bisaTarik && tarik ? tarik.total_biaya : 0;
  const diterimaPenjual = bisaTarik && tarik ? tarik.diterima : h.bagianPenjual;
  const bank = digit(biayaBank);
  const untungTransaksi = h.tertahan + biayaTarik - bank;
  const bulanan = untungTransaksi * digit(perBulan);
  const rugi = untungTransaksi < 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold text-neutral-900">Transaksi</div>
          <div>
            <label className={label}>Nominal transaksi (Rp)</label>
            <input
              value={nominal}
              inputMode="numeric"
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 10);
                setNominal(d ? Number(d).toLocaleString('id-ID') : '');
              }}
              className={kotak}
            />
          </div>
          <div>
            <label className={label}>Perkiraan jumlah transaksi per bulan</label>
            <input value={perBulan} inputMode="numeric" onChange={(e) => setPerBulan(e.target.value.replace(/\D/g, '').slice(0, 7))} className={kotak} />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold text-neutral-900">Biaya payment gateway (DOKU)</div>
          <p className="text-xs text-neutral-500">
            Isi sesuai kontrak DOKU. Nilai awal dari contoh laporan Anda: Rp 1.000 ditambah PPN 11% menjadi Rp 1.110.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Biaya tetap (Rp)</label>
              <input value={dokuFlat} inputMode="decimal" onChange={(e) => setDokuFlat(e.target.value)} className={kotak} />
            </div>
            <div>
              <label className={label}>Biaya persen (%)</label>
              <input value={dokuPersen} inputMode="decimal" onChange={(e) => setDokuPersen(e.target.value)} className={kotak} />
            </div>
            <div>
              <label className={label}>PPN (%)</label>
              <input value={dokuPpn} inputMode="decimal" onChange={(e) => setDokuPpn(e.target.value)} className={kotak} />
            </div>
            <label className="flex items-center gap-2 pt-5 text-sm">
              <input type="checkbox" checked={dokuKenaPpn} onChange={(e) => setDokuKenaPpn(e.target.checked)} className="h-4 w-4" />
              Kena PPN
            </label>
          </div>
          <div>
            <label className={label}>Siapa yang menanggung biaya DOKU</label>
            <select value={penanggung} onChange={(e) => setPenanggung(e.target.value as Penanggung)} className={kotak}>
              <option value="platform">Platform (dipotong dari komisi)</option>
              <option value="penjual">Penjual / pekerja (dipotong dari bagiannya)</option>
              <option value="pembeli">Pembeli (ditambahkan ke tagihan)</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold text-neutral-900">Bagi hasil platform</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Komisi (%)</label>
              <input value={komisiPersen} inputMode="decimal" onChange={(e) => setKomisiPersen(e.target.value)} className={kotak} />
            </div>
            <div>
              <label className={label}>Komisi tetap (Rp)</label>
              <input value={komisiFlat} inputMode="decimal" onChange={(e) => setKomisiFlat(e.target.value)} className={kotak} />
            </div>
          </div>
          <div>
            <label className={label}>Biaya transfer bank yang Anda bayar tiap penarikan (Rp)</label>
            <input
              value={biayaBank}
              inputMode="numeric"
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 7);
                setBiayaBank(d ? Number(d).toLocaleString('id-ID') : '');
              }}
              className={kotak}
            />
          </div>
          <p className="text-xs text-neutral-500">
            Biaya penarikan untuk penjual diambil otomatis dari Aturan Penarikan yang sudah tersimpan.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Langkah no={1} judul="Pembeli membayar">
          <Baris k="Nominal transaksi" v={rp(h.N)} />
          {penanggung === 'pembeli' && <Baris k="Biaya DOKU ditambahkan ke tagihan" v={rp(h.FT)} />}
          <Baris k="Total dibayar pembeli" v={rp(h.bayarPembeli)} tebal />
        </Langkah>

        <Langkah no={2} judul="DOKU menyelesaikan dana ke rekening Anda (T+1 hari kerja)">
          <Baris k="Dana dibayar pembeli" v={rp(h.bayarPembeli)} />
          <Baris k={`Biaya DOKU${h.ppnF > 0 ? ` (${rp(h.F)} + PPN ${rp(h.ppnF)})` : ''}`} v={'- ' + rp(h.FT)} warna="text-red-700" />
          <Baris k="Dana masuk ke rekening Anda" v={rp(h.settlement)} tebal />
        </Langkah>

        <Langkah no={3} judul="Pembagian hasil di saldo aplikasi">
          <Baris k="Komisi platform" v={rp(h.K)} />
          {penanggung === 'penjual' && <Baris k="Biaya DOKU dibebankan ke penjual" v={'- ' + rp(h.FT)} warna="text-red-700" />}
          <Baris k="Bagian penjual (masuk saldo)" v={rp(h.bagianPenjual)} tebal />
          <Baris
            k="Sisa dana tertahan di platform"
            v={rp(h.tertahan)}
            tebal
            warna={h.tertahan < 0 ? 'text-red-700' : 'text-green-700'}
          />
        </Langkah>

        <Langkah no={4} judul="Penjual menarik seluruh bagiannya">
          {!tarik ? (
            <p className="text-sm text-neutral-500">Memuat aturan penarikan...</p>
          ) : !bisaTarik ? (
            <p className="text-sm text-amber-700">
              Bagian penjual {rp(h.bagianPenjual)} masih di bawah minimal penarikan {rp(tarik.min_tarik)}.
            </p>
          ) : (
            <>
              <Baris k="Jumlah penarikan" v={rp(h.bagianPenjual)} />
              {tarik.biaya_aktif && tarik.total_biaya > 0 ? (
                <>
                  {tarik.rincian
                    .filter((x) => x.jumlah > 0)
                    .map((x) => (
                      <Baris key={x.nama} k={x.nama} v={'- ' + rp(x.jumlah)} warna="text-red-700" />
                    ))}
                  {tarik.ppn > 0 && <Baris k={`PPN ${tarik.ppn_persen}%`} v={'- ' + rp(tarik.ppn)} warna="text-red-700" />}
                </>
              ) : (
                <Baris k="Potongan biaya penarikan" v="Tidak ada (saklar biaya mati)" />
              )}
              <Baris k="Diterima penjual di rekening" v={rp(diterimaPenjual)} tebal />
              {tarik.jadwal_cair && <div className="mt-1 text-xs text-neutral-500">Jika diajukan sekarang, cair {tgl(tarik.jadwal_cair)}</div>}
            </>
          )}
          {gagal && <p className="mt-1 text-xs text-amber-700">Aturan penarikan belum bisa dimuat.</p>}
        </Langkah>

        <div className={`rounded-2xl border p-4 ${rugi ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
          <div className="text-sm font-semibold text-neutral-900">Hasil untuk platform</div>
          <Baris k="Sisa dana dari transaksi" v={rp(h.tertahan)} />
          <Baris k="Biaya penarikan dari penjual" v={rp(biayaTarik)} />
          <Baris k="Biaya transfer bank yang Anda bayar" v={'- ' + rp(bank)} warna="text-red-700" />
          <div className="mt-1 border-t border-neutral-300 pt-1">
            <Baris k="Untung bersih per transaksi" v={rp(untungTransaksi)} tebal warna={rugi ? 'text-red-700' : 'text-green-700'} />
            <Baris k={`Perkiraan per bulan (${digit(perBulan).toLocaleString('id-ID')} transaksi)`} v={rp(bulanan)} tebal warna={rugi ? 'text-red-700' : 'text-green-700'} />
          </div>
          {rugi && (
            <p className="mt-2 text-xs text-red-800">
              Platform rugi di transaksi ini karena komisi dan biaya penarikan lebih kecil dari biaya DOKU dan transfer
              bank. Naikkan komisi, bebankan biaya DOKU ke pembeli atau penjual, atau isi biaya penarikan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}