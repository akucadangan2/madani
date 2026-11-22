import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { rupiah } from '@/lib/admin/data';

type Umum = {
  min_tarik: number | string;
  maks_tarik_harian: number | string | null;
  cutoff_jam: string;
  sla_hari_kerja: number;
  ppn_persen: number | string;
  ppn_aktif: boolean;
  biaya_aktif: boolean;
  updated_at: string | null;
};

type Aturan = {
  id: string;
  nama: string;
  tipe: string;
  nilai: number | string;
  min_biaya: number | string;
  maks_biaya: number | string | null;
  kena_ppn: boolean;
  aktif: boolean;
  urutan: number;
};

type Libur = { tanggal: string; keterangan: string };

type Riwayat = {
  id: number;
  tabel: string;
  aksi: string;
  sebelum: Record<string, unknown> | null;
  sesudah: Record<string, unknown> | null;
  at: string;
};

type Sim = {
  jumlah: number;
  rincian: { nama: string; jumlah: number }[];
  ppn_persen: number;
  ppn: number;
  total_biaya: number;
  diterima: number;
  biaya_aktif: boolean;
  jadwal_cair: string | null;
};

const BASE = '/admin/pengaturan-penarikan';

function balik(kv: Record<string, string>) {
  return `${BASE}?${new URLSearchParams(kv).toString()}`;
}

function angka(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function tglIndo(s: string) {
  return new Date(s + 'T12:00:00+07:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

function waktu(v: string) {
  return new Date(v).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------- Aksi ----------

async function simpanUmum(formData: FormData): Promise<void> {
  'use server';
  const min = angka(formData.get('min_tarik'));
  const maks = angka(formData.get('maks_tarik_harian'));
  const sla = angka(formData.get('sla_hari_kerja'));
  const ppn = angka(formData.get('ppn_persen'));
  const cutoff = String(formData.get('cutoff_jam') ?? '').trim().slice(0, 5);

  if (min === null || Number.isNaN(min) || min < 0) redirect(balik({ error: 'Minimal penarikan tidak valid' }));
  if (maks !== null && (Number.isNaN(maks) || maks <= 0)) redirect(balik({ error: 'Batas harian tidak valid' }));
  if (sla === null || Number.isNaN(sla) || sla < 0 || sla > 14)
    redirect(balik({ error: 'Lama proses harus 0 sampai 14 hari kerja' }));
  if (ppn === null || Number.isNaN(ppn) || ppn < 0 || ppn > 100) redirect(balik({ error: 'PPN harus 0 sampai 100' }));
  if (!/^\d{2}:\d{2}$/.test(cutoff)) redirect(balik({ error: 'Jam cut-off tidak valid' }));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pengaturan_penarikan')
    .update({
      min_tarik: min,
      maks_tarik_harian: maks,
      cutoff_jam: cutoff,
      sla_hari_kerja: Math.round(sla),
      ppn_persen: ppn,
      ppn_aktif: formData.get('ppn_aktif') === 'on',
      biaya_aktif: formData.get('biaya_aktif') === 'on',
    })
    .eq('id', true)
    .select('id');
  if (error) redirect(balik({ error: error.message }));
  if (!data || data.length === 0) redirect(balik({ error: 'Tidak ada yang tersimpan. Periksa akses admin.' }));

  revalidatePath(BASE);
  redirect(balik({ ok: 'Pengaturan umum disimpan' }));
}

function bacaAturan(formData: FormData) {
  const nama = String(formData.get('nama') ?? '').trim().slice(0, 80);
  const tipe = String(formData.get('tipe') ?? '');
  const nilai = angka(formData.get('nilai'));
  const minB = angka(formData.get('min_biaya')) ?? 0;
  const maksB = angka(formData.get('maks_biaya'));
  const urutan = Math.round(angka(formData.get('urutan')) ?? 0);

  if (!nama) return { salah: 'Nama komponen wajib diisi' } as const;
  if (tipe !== 'flat' && tipe !== 'persen') return { salah: 'Jenis biaya tidak valid' } as const;
  if (nilai === null || Number.isNaN(nilai) || nilai < 0) return { salah: 'Nilai biaya tidak valid' } as const;
  if (tipe === 'persen' && nilai > 100) return { salah: 'Persen tidak boleh lebih dari 100' } as const;
  if (Number.isNaN(minB) || minB < 0) return { salah: 'Biaya minimum tidak valid' } as const;
  if (maksB !== null && (Number.isNaN(maksB) || maksB < minB))
    return { salah: 'Biaya maksimum harus sama atau lebih besar dari minimum' } as const;

  return {
    salah: null,
    data: {
      jenis: 'tarik',
      nama,
      tipe,
      nilai,
      min_biaya: minB,
      maks_biaya: maksB,
      kena_ppn: formData.get('kena_ppn') === 'on',
      aktif: formData.get('aktif') === 'on',
      urutan,
    },
  } as const;
}

async function simpanAturan(formData: FormData): Promise<void> {
  'use server';
  const id = String(formData.get('id') ?? '');
  const h = bacaAturan(formData);
  if (!id) redirect(balik({ error: 'Data tidak valid' }));
  if (h.salah) redirect(balik({ error: h.salah }));

  const supabase = await createClient();
  const { error } = await supabase.from('aturan_biaya').update(h.data!).eq('id', id);
  if (error) redirect(balik({ error: error.message }));
  revalidatePath(BASE);
  redirect(balik({ ok: `Komponen "${h.data!.nama}" disimpan` }));
}

async function tambahAturan(formData: FormData): Promise<void> {
  'use server';
  const h = bacaAturan(formData);
  if (h.salah) redirect(balik({ error: h.salah }));

  const supabase = await createClient();
  const { error } = await supabase.from('aturan_biaya').insert(h.data!);
  if (error) redirect(balik({ error: error.message }));
  revalidatePath(BASE);
  redirect(balik({ ok: `Komponen "${h.data!.nama}" ditambahkan` }));
}

async function hapusAturan(formData: FormData): Promise<void> {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) redirect(balik({ error: 'Data tidak valid' }));
  const supabase = await createClient();
  const { error } = await supabase.from('aturan_biaya').delete().eq('id', id);
  if (error) redirect(balik({ error: error.message }));
  revalidatePath(BASE);
  redirect(balik({ ok: 'Komponen dihapus. Pengajuan lama tidak berubah karena biayanya sudah terkunci.' }));
}

async function tambahLibur(formData: FormData): Promise<void> {
  'use server';
  const teks = String(formData.get('daftar') ?? '');
  const baris: { tanggal: string; keterangan: string }[] = [];
  for (const raw of teks.split(/\r?\n/)) {
    const s = raw.trim();
    if (!s) continue;
    const m = s.match(/^(\d{4}-\d{2}-\d{2})\s*[-,;:]?\s*(.*)$/);
    if (!m) redirect(balik({ error: `Format salah: "${s.slice(0, 40)}". Pakai TTTT-BB-HH keterangan` }));
    const d = new Date(m![1] + 'T00:00:00Z');
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== m![1])
      redirect(balik({ error: `Tanggal tidak ada: ${m![1]}` }));
    baris.push({ tanggal: m![1], keterangan: m![2].trim().slice(0, 100) });
  }
  if (baris.length === 0) redirect(balik({ error: 'Isi minimal satu tanggal' }));

  const supabase = await createClient();
  const { error } = await supabase.from('hari_libur').upsert(baris, { onConflict: 'tanggal' });
  if (error) redirect(balik({ error: error.message }));
  revalidatePath(BASE);
  redirect(balik({ ok: `${baris.length} hari libur disimpan` }));
}

async function hapusLibur(formData: FormData): Promise<void> {
  'use server';
  const tanggal = String(formData.get('tanggal') ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) redirect(balik({ error: 'Data tidak valid' }));
  const supabase = await createClient();
  const { error } = await supabase.from('hari_libur').delete().eq('tanggal', tanggal);
  if (error) redirect(balik({ error: error.message }));
  revalidatePath(BASE);
  redirect(balik({ ok: 'Hari libur dihapus' }));
}

// ---------- Tampilan ----------

const kotak = 'w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm';
const label = 'mb-1 block text-xs font-medium text-neutral-600';

function ringkasRiwayat(r: Riwayat) {
  const abaikan = new Set(['updated_at', 'updated_by', 'created_at', 'id']);
  const a = r.sebelum ?? {};
  const b = r.sesudah ?? {};
  if (r.aksi === 'INSERT') return `Menambah ${String(b.nama ?? b.tanggal ?? '')}`.trim();
  if (r.aksi === 'DELETE') return `Menghapus ${String(a.nama ?? a.tanggal ?? '')}`.trim();
  const beda: string[] = [];
  for (const k of Object.keys(b)) {
    if (abaikan.has(k)) continue;
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) beda.push(`${k}: ${String(a[k] ?? '-')} menjadi ${String(b[k] ?? '-')}`);
  }
  const nama = b.nama ? `${String(b.nama)}: ` : '';
  return nama + (beda.length ? beda.join('; ') : 'Tanpa perubahan nilai');
}

export default async function PengaturanPenarikan({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; sim?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const tahun = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }).slice(0, 4);
  const simJumlah = Math.max(0, Math.floor(Number(String(sp.sim ?? '').replace(/\D/g, '')) || 0));

  const [{ data: u }, { data: a }, { data: l }, { data: rw }, simRes] = await Promise.all([
    supabase.from('pengaturan_penarikan').select('*').eq('id', true).maybeSingle(),
    supabase.from('aturan_biaya').select('*').eq('jenis', 'tarik').order('urutan').order('created_at'),
    supabase.from('hari_libur').select('tanggal, keterangan').gte('tanggal', `${tahun}-01-01`).order('tanggal').limit(200),
    supabase.from('riwayat_pengaturan').select('id, tabel, aksi, sebelum, sesudah, at').order('at', { ascending: false }).limit(15),
    simJumlah > 0 ? supabase.rpc('app_rincian_penarikan', { p_jumlah: simJumlah }) : Promise.resolve({ data: null }),
  ]);

  const umum = u as Umum | null;
  const aturan = (a ?? []) as Aturan[];
  const libur = (l ?? []) as Libur[];
  const riwayat = (rw ?? []) as Riwayat[];
  const sim = (simRes.data ?? null) as Sim | null;

  if (!umum) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Pengaturan penarikan belum ada. Jalankan file penarikan-biaya.sql di Supabase SQL Editor terlebih dahulu.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Aturan Penarikan</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Atur jadwal cair, biaya potongan, dan PPN dari sini. Aplikasi dan web langsung mengikuti, tanpa update
            aplikasi.
          </p>
        </div>
        <div className="flex gap-4 text-sm font-medium text-secondary-700">
          <Link href="/admin/pencairan-dana/agenda" className="hover:underline">
            Agenda transfer
          </Link>
          <Link href="/admin/pencairan-dana" className="hover:underline">
            Pencairan dana
          </Link>
        </div>
      </div>

      {sp.ok && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">{sp.ok}</div>
      )}
      {sp.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{sp.error}</div>
      )}

      {!umum.biaya_aktif && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Biaya potongan belum diterapkan. Semua penarikan saat ini tanpa potongan. Nyalakan saklar "Terapkan biaya"
          setelah sebagian besar pengguna memperbarui aplikasi, supaya rincian biaya tampil di aplikasi mereka.
        </div>
      )}

      {/* Umum */}
      <form action={simpanUmum} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold text-neutral-900">Aturan umum</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={label}>Minimal penarikan (Rp)</label>
            <input name="min_tarik" type="number" step="any" min="0" defaultValue={Number(umum.min_tarik)} className={kotak} />
          </div>
          <div>
            <label className={label}>Batas per hari per pengguna (Rp, kosong = tanpa batas)</label>
            <input
              name="maks_tarik_harian"
              type="number"
              step="any"
              min="0"
              defaultValue={umum.maks_tarik_harian === null ? '' : Number(umum.maks_tarik_harian)}
              className={kotak}
            />
          </div>
          <div>
            <label className={label}>Lama proses (hari kerja)</label>
            <input name="sla_hari_kerja" type="number" min="0" max="14" defaultValue={umum.sla_hari_kerja} className={kotak} />
          </div>
          <div>
            <label className={label}>Jam cut-off (WIB)</label>
            <input name="cutoff_jam" type="time" defaultValue={String(umum.cutoff_jam).slice(0, 5)} className={kotak} />
          </div>
          <div>
            <label className={label}>PPN (%)</label>
            <input name="ppn_persen" type="number" step="any" min="0" max="100" defaultValue={Number(umum.ppn_persen)} className={kotak} />
          </div>
          <label className="flex items-center gap-2 pt-5 text-sm text-neutral-800">
            <input type="checkbox" name="ppn_aktif" defaultChecked={umum.ppn_aktif} className="h-4 w-4" />
            PPN dipungut
          </label>
          <label className="col-span-full flex items-center gap-2 rounded-xl bg-neutral-50 p-3 text-sm font-medium text-neutral-900 lg:col-span-2">
            <input type="checkbox" name="biaya_aktif" defaultChecked={umum.biaya_aktif} className="h-4 w-4" />
            Terapkan biaya potongan ke penarikan baru
          </label>
        </div>
        <p className="text-xs text-neutral-500">
          Pengajuan setelah jam cut-off, di akhir pekan, atau di hari libur dihitung mulai hari kerja
          berikutnya. Biaya dan jadwal setiap pengajuan dikunci saat diajukan, jadi perubahan di sini tidak mengubah
          pengajuan yang sudah masuk.
        </p>
        <button className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          Simpan aturan umum
        </button>
      </form>

      {/* Komponen biaya */}
      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
        <div>
          <h2 className="font-semibold text-neutral-900">Komponen biaya penarikan</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Contoh: biaya transfer bank Rp 2.500 (flat), atau biaya layanan 1% dengan minimum Rp 1.000. Biaya diurutkan
            sesuai nomor urut. Hanya komponen yang dicentang "Kena PPN" yang ikut dihitung PPN.
          </p>
        </div>

        {aturan.length === 0 && <p className="text-sm text-neutral-500">Belum ada komponen biaya.</p>}

        {aturan.map((x) => (
          <form key={x.id} action={simpanAturan} className="rounded-xl border border-neutral-200 p-3">
            <input type="hidden" name="id" value={x.id} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="lg:col-span-2">
                <label className={label}>Nama</label>
                <input name="nama" defaultValue={x.nama} className={kotak} />
              </div>
              <div>
                <label className={label}>Jenis</label>
                <select name="tipe" defaultValue={x.tipe} className={kotak}>
                  <option value="flat">Tetap (Rp)</option>
                  <option value="persen">Persen (%)</option>
                </select>
              </div>
              <div>
                <label className={label}>Nilai</label>
                <input name="nilai" type="number" step="any" min="0" defaultValue={Number(x.nilai)} className={kotak} />
              </div>
              <div>
                <label className={label}>Minimum (Rp)</label>
                <input name="min_biaya" type="number" step="any" min="0" defaultValue={Number(x.min_biaya)} className={kotak} />
              </div>
              <div>
                <label className={label}>Maksimum (Rp)</label>
                <input
                  name="maks_biaya"
                  type="number"
                  step="any"
                  min="0"
                  defaultValue={x.maks_biaya === null ? '' : Number(x.maks_biaya)}
                  className={kotak}
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="w-20">
                <label className={label}>Urutan</label>
                <input name="urutan" type="number" defaultValue={x.urutan} className={kotak} />
              </div>
              <label className="flex items-center gap-2 pt-4 text-sm">
                <input type="checkbox" name="kena_ppn" defaultChecked={x.kena_ppn} className="h-4 w-4" /> Kena PPN
              </label>
              <label className="flex items-center gap-2 pt-4 text-sm">
                <input type="checkbox" name="aktif" defaultChecked={x.aktif} className="h-4 w-4" /> Aktif
              </label>
              <div className="ml-auto flex gap-2 pt-4">
                <button className="rounded-lg bg-ink-900 px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90">
                  Simpan
                </button>
                <button
                  formAction={hapusAturan}
                  className="rounded-lg border border-red-300 px-3.5 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Hapus
                </button>
              </div>
            </div>
          </form>
        ))}

        <form action={tambahAturan} className="rounded-xl border border-dashed border-neutral-300 p-3">
          <div className="mb-2 text-sm font-medium text-neutral-800">Tambah komponen</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className={label}>Nama</label>
              <input name="nama" placeholder="Contoh: Biaya admin" className={kotak} />
            </div>
            <div>
              <label className={label}>Jenis</label>
              <select name="tipe" defaultValue="flat" className={kotak}>
                <option value="flat">Tetap (Rp)</option>
                <option value="persen">Persen (%)</option>
              </select>
            </div>
            <div>
              <label className={label}>Nilai</label>
              <input name="nilai" type="number" step="any" min="0" defaultValue={0} className={kotak} />
            </div>
            <div>
              <label className={label}>Minimum (Rp)</label>
              <input name="min_biaya" type="number" step="any" min="0" defaultValue={0} className={kotak} />
            </div>
            <div>
              <label className={label}>Maksimum (Rp)</label>
              <input name="maks_biaya" type="number" step="any" min="0" className={kotak} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="w-20">
              <label className={label}>Urutan</label>
              <input name="urutan" type="number" defaultValue={aturan.length + 1} className={kotak} />
            </div>
            <label className="flex items-center gap-2 pt-4 text-sm">
              <input type="checkbox" name="kena_ppn" defaultChecked className="h-4 w-4" /> Kena PPN
            </label>
            <label className="flex items-center gap-2 pt-4 text-sm">
              <input type="checkbox" name="aktif" defaultChecked className="h-4 w-4" /> Aktif
            </label>
            <button className="ml-auto mt-4 rounded-lg border border-neutral-300 px-3.5 py-1.5 text-sm font-semibold hover:bg-neutral-50">
              Tambah
            </button>
          </div>
        </form>
      </section>

      {/* Simulasi */}
      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold text-neutral-900">Simulasi</h2>
        <p className="text-xs text-neutral-500">
          Lihat persis yang akan dilihat pengguna. Simpan perubahan dulu, lalu coba nominalnya.
        </p>
        <form method="get" className="flex flex-wrap items-center gap-2">
          <input
            name="sim"
            inputMode="numeric"
            defaultValue={simJumlah > 0 ? String(simJumlah) : ''}
            placeholder="Nominal, mis. 100000"
            className="w-48 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <button className="rounded-lg border border-neutral-300 px-3.5 py-1.5 text-sm font-semibold hover:bg-neutral-50">
            Hitung
          </button>
        </form>
        {sim && (
          <div className="max-w-md rounded-xl bg-neutral-50 p-4 text-sm">
            <div className="flex justify-between py-0.5">
              <span>Jumlah penarikan</span>
              <span>{rupiah(sim.jumlah)}</span>
            </div>
            {sim.biaya_aktif ? (
              <>
                {sim.rincian
                  .filter((x) => x.jumlah > 0)
                  .map((x) => (
                    <div key={x.nama} className="flex justify-between py-0.5 text-red-700">
                      <span>{x.nama}</span>
                      <span>- {rupiah(x.jumlah)}</span>
                    </div>
                  ))}
                {sim.ppn > 0 && (
                  <div className="flex justify-between py-0.5 text-red-700">
                    <span>PPN {sim.ppn_persen}%</span>
                    <span>- {rupiah(sim.ppn)}</span>
                  </div>
                )}
                <div className="flex justify-between py-0.5">
                  <span>Total potongan</span>
                  <span>{rupiah(sim.total_biaya)}</span>
                </div>
              </>
            ) : (
              <div className="py-0.5 text-amber-800">Saklar biaya masih mati, tanpa potongan.</div>
            )}
            <div className="mt-1 flex justify-between border-t border-neutral-200 pt-1.5 font-bold">
              <span>Diterima pengguna</span>
              <span>{rupiah(sim.diterima)}</span>
            </div>
            {sim.jadwal_cair && <div className="mt-2 text-xs text-neutral-600">Jika diajukan sekarang, cair {tglIndo(sim.jadwal_cair)}</div>}
          </div>
        )}
      </section>

      {/* Hari libur */}
      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
        <div>
          <h2 className="font-semibold text-neutral-900">Hari libur</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Sabtu dan Minggu otomatis libur. Tambahkan libur nasional dan cuti bersama sesuai SKB tiga menteri tahun
            berjalan agar estimasi cair akurat.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <form action={tambahLibur} className="space-y-2">
            <label className={label}>Tambah (satu per baris: TTTT-BB-HH keterangan)</label>
            <textarea
              name="daftar"
              rows={6}
              placeholder={'2027-03-10 Hari Raya Nyepi\n2027-03-11 Cuti bersama'}
              className={kotak + ' font-mono'}
            />
            <button className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Simpan hari libur
            </button>
          </form>
          <div className="max-h-72 overflow-y-auto rounded-xl border border-neutral-200">
            {libur.length === 0 ? (
              <p className="p-3 text-sm text-neutral-500">Belum ada hari libur tahun ini dan seterusnya.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {libur.map((h) => (
                  <li key={h.tanggal} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span>
                      <span className="font-medium">{tglIndo(h.tanggal)}</span>
                      {h.keterangan && <span className="text-neutral-500"> - {h.keterangan}</span>}
                    </span>
                    <form action={hapusLibur}>
                      <input type="hidden" name="tanggal" value={h.tanggal} />
                      <button className="text-xs font-semibold text-red-700 hover:underline">Hapus</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Riwayat */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold text-neutral-900">Riwayat perubahan</h2>
        {riwayat.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Belum ada perubahan.</p>
        ) : (
          <ul className="mt-2 divide-y divide-neutral-100 text-sm">
            {riwayat.map((r) => (
              <li key={r.id} className="py-2">
                <div className="text-xs text-neutral-500">
                  {waktu(r.at)} - {r.tabel}
                </div>
                <div className="text-neutral-800">{ringkasRiwayat(r)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}