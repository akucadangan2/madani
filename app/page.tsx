import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import {
  Briefcase, ShoppingBag, Smartphone, UserCheck, ScrollText, ChevronRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const LANGKAH = [
  { judul: 'Daftar pakai WhatsApp', isi: 'Masukkan nomor, terima kode OTP, selesai. Tanpa password.' },
  { judul: 'Pilih peran', isi: 'Pencari kerja, pemberi kerja, penjual, atau pembeli. Boleh lebih dari satu.' },
  { judul: 'Cari atau posting', isi: 'Lamar pekerjaan, pasang lowongan, buka toko, atau belanja dari tetangga.' },
  { judul: 'Bayar dengan aman', isi: 'Dana ditahan MADANI dan baru cair setelah pekerjaan atau barang diterima.' },
];

const KEAMANAN = [
  { icon: UserCheck, judul: 'Identitas terverifikasi', isi: 'Pengguna aktif melewati verifikasi e-KTP sebelum bertransaksi.' },
  { icon: Smartphone, judul: 'Masuk lewat WhatsApp', isi: 'Kode sekali pakai dikirim ke nomormu, jadi tidak ada password yang bisa bocor.' },
  { icon: ScrollText, judul: 'Aktivitas tercatat', isi: 'Setiap transaksi punya catatan yang bisa diperiksa kalau terjadi sengketa.' },
];

type TiketProps = {
  tone: 'kerja' | 'belanja';
  judul: string;
  lokasi: string;
  harga: string;
  rot: string;
  delay: string;
  className?: string;
};

function Tiket({ tone, judul, lokasi, harga, rot, delay, className = '' }: TiketProps) {
  const kerja = tone === 'kerja';
  return (
    <article
      className={`tiket relative w-full max-w-[15rem] rounded-md border-[1.5px] border-ink-700 bg-white p-4 ${className}`}
      style={{ '--rot': rot, '--d': delay } as React.CSSProperties}
    >
      <span
        aria-hidden
        className="absolute -top-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[1.5px] border-ink-700 bg-sun-400"
      />
      <div
        className={`mb-2 inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold ${
          kerja ? 'bg-secondary-500 text-white' : 'bg-primary-500 text-ink-900'
        }`}
      >
        {kerja ? <Briefcase className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
        {kerja ? 'Kerja' : 'Belanja'}
      </div>
      <h3 className="font-display text-[17px] font-bold leading-snug text-ink-700">{judul}</h3>
      <p className="mt-1 text-sm text-neutral-500">{lokasi}</p>
      <p className="mt-3 inline-block rounded-md bg-sun-400 px-2 py-0.5 text-sm font-bold text-ink-800">
        {harga}
      </p>
    </article>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect('/beranda');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/madani.png" alt="MADANI" className="h-9 w-auto" />
          </Link>
          <nav className="hidden items-center gap-8 text-[15px] font-medium text-neutral-600 md:flex">
            <a href="#dua-pasar" className="hover:text-ink-700">Dua pasar</a>
            <a href="#cara-kerja" className="hover:text-ink-700">Cara kerja</a>
            <a href="#bagi-hasil" className="hover:text-ink-700">Bagi hasil</a>
            <a href="#aman" className="hover:text-ink-700">Keamanan</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <Link href="/login" className="rounded-full px-4 py-2 text-[15px] font-semibold text-ink-700 hover:bg-neutral-100">
              Masuk
            </Link>
            <Link href="/register" className="rounded-full bg-ink-700 px-5 py-2 text-[15px] font-semibold text-white hover:bg-ink-800">
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-12 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <h1 className="text-[clamp(2.6rem,6.2vw,4.6rem)] font-extrabold leading-[1.02] text-ink-700">
            Kerja dan belanja, sama tetangga sendiri.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-600">
            MADANI mempertemukan warga satu kecamatan: lowongan kerja harian dan toko-toko di sekitar
            rumah. Uangnya ditahan aman sampai pekerjaan selesai atau barang sampai.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="rounded-full bg-ink-700 px-7 py-3.5 text-center font-semibold text-white hover:bg-ink-800">
              Daftar gratis
            </Link>
            <Link href="/login" className="rounded-full border-2 border-ink-700 px-7 py-3.5 text-center font-semibold text-ink-700 hover:bg-ink-50">
              Saya sudah punya akun
            </Link>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-neutral-500">
            <Smartphone className="h-4 w-4" />
            Masuk lewat kode WhatsApp, tanpa password.
          </p>
        </div>

        {/* Papan pengumuman */}
        <div
          className="relative flex flex-col items-center gap-5 rounded-[28px] bg-[#E6F2EA] p-6 pb-14 sm:p-8 sm:pb-14 lg:block lg:min-h-[540px] lg:p-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(12,42,87,0.16) 1.2px, transparent 1.2px)',
            backgroundSize: '20px 20px',
          }}
        >
          <Tiket tone="kerja" judul="Dicari tukang cat harian" lokasi="Kedaton, 2 jam lalu" harga="Rp150.000 per hari"
            rot="-3deg" delay="80ms" className="lg:absolute lg:left-6 lg:top-10" />
          <Tiket tone="belanja" judul="Nasi uduk dan gorengan, 20 porsi" lokasi="Toko Bu Rina, Rajabasa" harga="Rp12.000"
            rot="2.5deg" delay="200ms" className="lg:absolute lg:right-6 lg:top-24" />
          <Tiket tone="kerja" judul="Kurir antar sembako, pagi hari" lokasi="Sukarame, kemarin" harga="Rp80.000 per hari"
            rot="1.5deg" delay="320ms" className="lg:absolute lg:left-4 lg:top-[17rem]" />
          <Tiket tone="belanja" judul="Bayam segar, seikat" lokasi="Kebun Pak Slamet, Way Halim" harga="Rp5.000"
            rot="-2deg" delay="440ms" className="lg:absolute lg:right-4 lg:top-[19.5rem]" />
          <p className="absolute bottom-4 left-6 right-6 text-xs text-ink-600/70">
            Contoh tampilan papan. Isi sebenarnya dari warga di kecamatanmu.
          </p>
        </div>
      </section>

      {/* Dua pasar */}
      <section id="dua-pasar" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-20">
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-ink-700 md:text-4xl">
          Dua pasar dalam satu aplikasi
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-12">
          <div className="rounded-[28px] bg-secondary-700 p-7 text-white md:col-span-7 md:p-10">
            <Briefcase className="h-7 w-7 text-secondary-200" />
            <h3 className="mt-5 text-3xl font-extrabold leading-tight text-white">Pasar kerja harian</h3>
            <p className="mt-3 max-w-md text-secondary-100">
              Pasang lowongan atau cari kerja low-skill di kecamatanmu sendiri. Cocok untuk tukang,
              kurir, asisten usaha, dan pekerjaan lain yang dibayar per hari.
            </p>
            <ol className="mt-7 flex flex-wrap items-center gap-2 text-sm font-semibold">
              {['Melamar', 'Diterima', 'Dikerjakan', 'Dibayar'].map((s, i, arr) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3.5 py-1.5">{s}</span>
                  {i < arr.length - 1 && <ChevronRight className="h-4 w-4 text-secondary-200" />}
                </li>
              ))}
            </ol>
            <Link href="/kerja" className="mt-8 inline-flex rounded-full bg-white px-5 py-2.5 font-semibold text-secondary-700 hover:bg-secondary-50">
              Lihat lowongan
            </Link>
          </div>

          <div className="rounded-[28px] bg-primary-500 p-7 text-ink-900 md:col-span-5 md:p-10">
            <ShoppingBag className="h-7 w-7 text-ink-800" />
            <h3 className="mt-5 text-3xl font-extrabold leading-tight text-ink-900">Pasar barang sekitar</h3>
            <p className="mt-3 text-ink-800">
              Buka toko gratis atau belanja dari penjual satu kecamatan. Barang diantar penjual, tanpa
              ongkir ekspedisi.
            </p>
            <dl className="mt-6 divide-y divide-ink-900/15 rounded-2xl bg-white/45 px-4">
              {[
                ['Nasi uduk', 'Rp12.000'],
                ['Bayam, seikat', 'Rp5.000'],
                ['Keripik pisang 250 g', 'Rp18.000'],
              ].map(([nama, harga]) => (
                <div key={nama} className="flex items-center justify-between py-3 text-sm">
                  <dt className="font-medium">{nama}</dt>
                  <dd className="font-bold">{harga}</dd>
                </div>
              ))}
            </dl>
            <Link href="/marketplace" className="mt-8 inline-flex rounded-full bg-ink-800 px-5 py-2.5 font-semibold text-white hover:bg-ink-900">
              Lihat toko sekitar
            </Link>
          </div>
        </div>
      </section>

      {/* Cara kerja */}
      <section id="cara-kerja" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24">
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-ink-700 md:text-4xl">
          Empat langkah, langsung jalan
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
          {LANGKAH.map((l, i) => (
            <li
              key={l.judul}
              className="relative md:after:absolute md:after:left-14 md:after:right-0 md:after:top-[22px] md:after:h-[2px] md:after:bg-ink-200 md:last:after:hidden"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-700 font-display text-lg font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink-700">{l.judul}</h3>
              <p className="mt-1.5 max-w-[16rem] text-neutral-600">{l.isi}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Bagi hasil */}
      <section id="bagi-hasil" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24">
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-ink-700 md:text-4xl">
          Setiap transaksi, tiga pihak ikut kebagian
        </h2>
        <p className="mt-3 max-w-xl text-neutral-600">
          Keuntungan nggak berhenti di platform. Sebagian kembali ke kecamatan tempat transaksi terjadi.
        </p>

        <div className="mt-10 flex h-14 overflow-hidden rounded-full border-2 border-ink-700">
          <div className="bg-ink-700" style={{ width: '10%' }} />
          <div className="bg-primary-500" style={{ width: '80%' }} />
          <div className="bg-secondary-500" style={{ width: '10%' }} />
        </div>

        <dl className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="flex gap-3">
            <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-ink-700" />
            <div>
              <dt className="font-display text-xl font-bold text-ink-700">10% Platform MADANI</dt>
              <dd className="text-neutral-600">Menjaga transaksi tetap aman, adil, dan mudah diakses.</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-primary-500" />
            <div>
              <dt className="font-display text-xl font-bold text-ink-700">80% Pekerja atau penjual</dt>
              <dd className="text-neutral-600">Yang mengerjakan atau menjual barangnya menerima bagian terbesar.</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-secondary-500" />
            <div>
              <dt className="font-display text-xl font-bold text-ink-700">10% Kecamatan</dt>
              <dd className="text-neutral-600">Kembali ke wilayah tempat transaksi terjadi.</dd>
            </div>
          </div>
        </dl>
        <p className="mt-6 text-sm text-neutral-500">
          Contoh pembagian bawaan. Persentasenya bisa diatur per kecamatan.
        </p>
      </section>

      {/* Keamanan */}
      <section id="aman" className="scroll-mt-20 rounded-t-[40px] bg-ink-700 text-white">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl font-extrabold leading-[1.05] text-white md:text-5xl">
              Uangmu ditahan sampai kerjaannya selesai.
            </h2>
            <ol className="mt-10 space-y-5">
              {[
                ['Pembeli membayar', 'Dana masuk ke MADANI, belum ke penjual.'],
                ['MADANI menahan dana', 'Selama pekerjaan berjalan atau barang dalam pengiriman.'],
                ['Penerima dibayar', 'Dana cair setelah pekerjaan atau barang dikonfirmasi diterima.'],
              ].map(([judul, isi]) => (
                <li key={judul} className="flex gap-4">
                  <span className="mt-2 h-3 w-3 shrink-0 rounded-full bg-primary-400" />
                  <div>
                    <p className="font-display text-xl font-bold text-white">{judul}</p>
                    <p className="text-white/70">{isi}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <ul className="divide-y divide-white/15 self-center border-y border-white/15">
            {KEAMANAN.map((k) => (
              <li key={k.judul} className="flex gap-4 py-6">
                <k.icon className="mt-1 h-6 w-6 shrink-0 text-primary-300" />
                <div>
                  <p className="font-display text-lg font-bold text-white">{k.judul}</p>
                  <p className="mt-1 text-white/70">{k.isi}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Penutup */}
      <section className="bg-ink-700 pb-24 pt-4 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-center">
          <h2 className="max-w-xl text-3xl font-extrabold leading-tight text-white md:text-4xl">
            Mulai dari kecamatanmu sendiri.
          </h2>
          <Link href="/register" className="rounded-full bg-primary-400 px-8 py-4 font-semibold text-ink-900 hover:bg-primary-300">
            Daftar gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/madani.png" alt="MADANI" className="h-8 w-auto self-start" />
          <div className="text-sm text-neutral-500">
            <p>Madani Berdaya</p>
            <a href="mailto:info@rhgteknologiindonesia.id" className="hover:text-ink-700">
              info@rhgteknologiindonesia.id / info@madani.id
            </a>
          </div>
          <p className="text-sm text-neutral-400">© {new Date().getFullYear()} MADANI</p>
        </div>
      </footer>
    </div>
  );
}