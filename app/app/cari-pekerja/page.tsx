import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowLeft, Search, MapPin, Plus, ChevronRight, ChevronDown, Users, FileText,
  Home, Sprout, PawPrint, Hammer, Truck, HeartHandshake, Store, PartyPopper, Laptop, Wrench,
  TreePine, GraduationCap, ShieldCheck, Umbrella, Sparkles, MoreHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ChatButton from '@/app/app/chat/_components/chat-button';

export const dynamic = 'force-dynamic';

type SP = { q?: string; k?: string; kec?: string; ready?: string };
type Pekerja = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  kecamatan: string | null;
  skills: string[] | null;
  online: boolean | null;
  tarif: number | string | null;
  satuan_tarif: string | null;
  jumlah_dokumen: number | null;
};

function pilihIkon(nama: string): LucideIcon {
  const n = nama.toLowerCase();
  if (n.includes('pertanian') || n.includes('perkebunan')) return Sprout;
  if (n.includes('peternakan') || n.includes('perikanan')) return PawPrint;
  if (n.includes('rumah tangga') || n.includes('hunian')) return Home;
  if (n.includes('bangunan')) return Hammer;
  if (n.includes('transportasi')) return Truck;
  if (n.includes('pendidikan') || n.includes('belajar')) return GraduationCap;
  if (n.includes('sosial') || n.includes('pendampingan')) return HeartHandshake;
  if (n.includes('perdagang') || n.includes('umkm')) return Store;
  if (n.includes('event') || n.includes('komunitas')) return PartyPopper;
  if (n.includes('teknologi') || n.includes('digital')) return Laptop;
  if (n.includes('kendaraan') || n.includes('peralatan')) return Wrench;
  if (n.includes('lingkungan') || n.includes('fasilitas umum')) return TreePine;
  if (n.includes('administrasi') || n.includes('layanan publik')) return FileText;
  if (n.includes('keamanan')) return ShieldCheck;
  if (n.includes('pariwisata') || n.includes('hospitality')) return Umbrella;
  if (n.includes('kecantikan') || n.includes('perawatan diri')) return Sparkles;
  if (n.includes('lainnya')) return MoreHorizontal;
  return Users;
}

function IkonKategori({ nama, className }: { nama: string; className?: string }) {
  const Ikon = pilihIkon(nama);
  return <Ikon className={className} />;
}

function buatHref(sp: SP, o: Partial<SP>) {
  const m = { ...sp, ...o };
  const p = new URLSearchParams();
  if (m.q) p.set('q', m.q);
  if (m.k) p.set('k', m.k);
  if (m.kec) p.set('kec', m.kec);
  if (m.ready) p.set('ready', m.ready);
  const s = p.toString();
  return s ? '/cari-pekerja?' + s : '/cari-pekerja';
}

export default async function CariPekerjaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const q = sp.q?.trim() ?? '';
  const k = sp.k?.trim() ?? '';

  const [{ data: kecList }, { data }] = await Promise.all([
    supabase.from('kecamatan').select('id, nama').order('nama'),
    supabase.rpc('app_cari_pekerja', { p_q: q || null, p_kecamatan: sp.kec || null, p_online: sp.ready === '1' }),
  ]);
  const semua = (data ?? []) as Pekerja[];

  // Kategori mengikuti tabel kategori yang diatur admin. Keahlian pekerja dicocokkan ke sub kategorinya;
  // keahlian yang tidak cocok masuk ke "Lainnya".
  const [{ data: katData }, { data: subData }] = await Promise.all([
    supabase.from('kategori').select('id, nama').eq('tipe', 'kerja').order('urutan').order('nama'),
    supabase.from('kategori_sub').select('kategori_id, nama'),
  ]);
  const subKeKategori = new Map<string, string>();
  for (const s of (subData ?? []) as { kategori_id: string; nama: string }[]) {
    subKeKategori.set(s.nama.trim().toLowerCase(), s.kategori_id);
  }
  const LAINNYA = 'lainnya';
  const grupPekerja = (p: Pekerja): Set<string> => {
    const g = new Set<string>();
    for (const s of p.skills ?? []) {
      const key = s.trim().toLowerCase();
      if (key) g.add(subKeKategori.get(key) ?? LAINNYA);
    }
    return g;
  };
  const hitung = new Map<string, number>();
  for (const p of semua) {
    for (const id of grupPekerja(p)) hitung.set(id, (hitung.get(id) ?? 0) + 1);
  }
  const kategori = [
    ...((katData ?? []) as { id: string; nama: string }[])
      .filter((c) => c.nama.trim().toLowerCase() !== 'lainnya')
      .map((c) => ({ id: c.id, nama: c.nama, n: hitung.get(c.id) ?? 0 })),
    { id: LAINNYA, nama: 'Lainnya', n: hitung.get(LAINNYA) ?? 0 },
  ].filter((c) => c.n > 0);

  const modeDaftar = q !== '' || k !== '';
  const daftar = q
    ? semua
    : k
      ? semua.filter((p) => grupPekerja(p).has(k))
      : [];

  return (
    <div className="min-h-screen bg-neutral-50 pb-16">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/beranda"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">Cari Pekerja</h1>
                <p className="text-sm text-neutral-500">Pilih kategori, lalu hubungi pekerja lewat chat</p>
              </div>
            </div>
            <Link
              href="/kerja/posting"
              className="hidden items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 sm:inline-flex"
            >
              <Plus className="h-4 w-4" /> Pasang lowongan
            </Link>
          </div>

          <form method="GET" className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari nama atau keahlian, mis. tukang cat"
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div className="flex gap-2.5">
              <div className="relative flex-1 sm:w-48 sm:flex-none">
                <select
                  name="kec"
                  defaultValue={sp.kec ?? ''}
                  className="w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-3 pr-9 text-sm text-neutral-700 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">Semua kecamatan</option>
                  {(kecList ?? []).map((c: { id: string; nama: string }) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </div>
              <label className="flex items-center gap-1.5 whitespace-nowrap text-sm text-neutral-700">
                <input type="checkbox" name="ready" value="1" defaultChecked={sp.ready === '1'} />
                Hanya yang ready
              </label>
              <button type="submit" className="rounded-lg bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-700">
                Cari
              </button>
            </div>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {!modeDaftar ? (
          kategori.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
              <Users className="mx-auto h-8 w-8 text-neutral-300" />
              <p className="mt-3 font-semibold text-neutral-900">Belum ada pekerja yang cocok</p>
              <p className="mt-1 text-sm text-neutral-500">
                {sp.ready === '1'
                  ? 'Belum ada pekerja yang sedang ready. Matikan filter "Hanya yang ready" untuk melihat semua.'
                  : 'Pekerja muncul di sini setelah mengisi keahlian di profilnya. Coba ganti kecamatan, atau pasang lowongan.'}
              </p>
              <Link href="/kerja/posting" className="mt-4 inline-flex rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600">
                Pasang lowongan
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Pilih kategori</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {kategori.map((c) => (
                  <Link
                    key={c.nama}
                    href={buatHref(sp, { k: c.id, q: undefined })}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-md hover:shadow-primary-500/5"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                        <IkonKategori nama={c.nama} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-neutral-900">{c.nama}</span>
                        <span className="block text-sm text-neutral-500">{c.n} pekerja</span>
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300" />
                  </Link>
                ))}
              </div>
            </>
          )
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <Link
                href={buatHref(sp, { k: undefined, q: undefined })}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Semua kategori
              </Link>
              <p className="text-sm text-neutral-500">
                {q ? 'Hasil untuk "' + q + '"' : 'Kategori: ' + (kategori.find((c) => c.id === k)?.nama ?? k)} - {daftar.length} pekerja
              </p>
            </div>

            {daftar.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
                <p className="font-semibold text-neutral-900">Belum ada pekerja yang cocok</p>
                <p className="mt-1 text-sm text-neutral-500">Coba kata kunci atau kecamatan lain.</p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {daftar.map((p) => {
                  const nama = p.full_name?.trim() || 'Pekerja';
                  return (
                    <li key={p.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg font-bold text-primary-700">
                            {nama.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate font-semibold text-neutral-900">
                            <span className="truncate">{nama}</span>
                            {p.online && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> Ready
                              </span>
                            )}
                          </p>
                          {Number(p.tarif ?? 0) > 0 && (
                            <p className="mt-0.5 text-sm font-semibold text-primary-700">
                              Rp {Number(p.tarif).toLocaleString('id-ID')}
                              {p.satuan_tarif ? ' / ' + p.satuan_tarif : ''}
                            </p>
                          )}
                          {p.kecamatan && (
                            <p className="mt-0.5 flex items-center gap-1 text-sm text-neutral-500">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {p.kecamatan}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(p.skills ?? []).slice(0, 6).map((s) => (
                          <span key={s} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium capitalize text-primary-700">
                            {s}
                          </span>
                        ))}
                      </div>
                      {Number(p.jumlah_dokumen ?? 0) > 0 && (
                        <Link
                          href={'/cari-pekerja/' + p.id + '?n=' + encodeURIComponent(nama)}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline"
                        >
                          <FileText className="h-4 w-4" /> Lihat sertifikat & dokumen ({p.jumlah_dokumen})
                        </Link>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <ChatButton lawanId={p.id} label={'Pekerja: ' + nama} href="/cari-pekerja" teks="Chat pekerja" kecil />
                        <Link
                          href="/kerja/posting"
                          className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          Pasang lowongan
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}