import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import {
  Briefcase, ShoppingBag, Smartphone, UserCheck, ScrollText, ChevronRight, ChevronDown,
  Search, Megaphone, Store, MessageCircle, Bell, Star, Wallet, LifeBuoy, MapPin,
  ShieldCheck, BadgeCheck, Landmark,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const NILAI = [
  { icon: BadgeCheck, judul: 'Daftar gratis', isi: 'Buka toko dan melamar kerja tanpa biaya.' },
  { icon: ShieldCheck, judul: 'Dana ditahan aman', isi: 'Cair setelah kerja atau barang diterima.' },
  { icon: MapPin, judul: 'Satu kecamatan', isi: 'Transaksi dengan warga sekitar.' },
  { icon: Smartphone, judul: 'Tanpa password', isi: 'Masuk lewat kode WhatsApp.' },
];

const PERAN = [
  {
    icon: Search,
    judul: 'Pencari kerja',
    isi: 'Cari pekerjaan harian dekat rumah dan lamar langsung dari HP.',
    poin: ['Lowongan di kecamatanmu', 'Upah ditahan sampai selesai', 'Rating membangun reputasimu'],
  },
  {
    icon: Megaphone,
    judul: 'Pemberi kerja',
    isi: 'Pasang lowongan, pilih pekerja yang cocok, bayar setelah beres.',
    poin: ['Posting dalam hitungan menit', 'Bandingkan para pelamar', 'Bayar aman lewat escrow'],
  },
  {
    icon: Store,
    judul: 'Penjual',
    isi: 'Buka toko gratis dan jual barang ke tetangga satu kecamatan.',
    poin: ['Kelola produk dan stok', 'Terima dan proses pesanan', 'Tarik dana ke rekeningmu'],
  },
  {
    icon: ShoppingBag,
    judul: 'Pembeli',
    isi: 'Belanja dari toko sekitar, tanya langsung ke penjualnya.',
    poin: ['Keranjang dan pesanan', 'Chat dengan penjual', 'Beri ulasan setelah terima'],
  },
];

const LANGKAH = [
  { judul: 'Daftar pakai WhatsApp', isi: 'Masukkan nomor, terima kode OTP, selesai. Tanpa password.' },
  { judul: 'Pilih peran', isi: 'Pencari kerja, pemberi kerja, penjual, atau pembeli. Boleh lebih dari satu.' },
  { judul: 'Cari atau posting', isi: 'Lamar pekerjaan, pasang lowongan, buka toko, atau belanja dari tetangga.' },
  { judul: 'Bayar dengan aman', isi: 'Dana ditahan MADANI dan baru cair setelah pekerjaan atau barang diterima.' },
];

const FITUR = [
  { icon: MapPin, judul: 'Papan per kecamatan', isi: 'Lowongan dan toko yang tampil adalah milik warga di wilayahmu.' },
  { icon: MessageCircle, judul: 'Chat langsung', isi: 'Tanya penjual atau ngobrol dengan pemberi kerja sebelum sepakat.' },
  { icon: Bell, judul: 'Notifikasi', isi: 'Pesan, pesanan, dan lamaran baru masuk ke HP-mu.' },
  { icon: Star, judul: 'Ulasan dan rating', isi: 'Reputasi penjual dan pekerja terlihat dari penilaian pengguna lain.' },
  { icon: Wallet, judul: 'Saldo dan penarikan', isi: 'Pantau pemasukan dan ajukan penarikan dana kapan saja.' },
  { icon: LifeBuoy, judul: 'Komplain dan bantuan', isi: 'Ada masalah? Ajukan komplain, tim kami tinjau dan bantu selesaikan.' },
];

const KEAMANAN = [
  { icon: UserCheck, judul: 'Identitas terverifikasi', isi: 'Pengguna aktif melewati verifikasi e-KTP sebelum bertransaksi.' },
  { icon: Smartphone, judul: 'Masuk lewat WhatsApp', isi: 'Kode sekali pakai dikirim ke nomormu, jadi tidak ada password yang bisa bocor.' },
  { icon: ScrollText, judul: 'Aktivitas tercatat', isi: 'Setiap transaksi punya catatan yang bisa diperiksa kalau terjadi sengketa.' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Apakah MADANI gratis?',
    a: 'Daftar dan membuka toko gratis. Setiap transaksi dibagi: 10% platform, 80% pekerja atau penjual, dan 10% kecamatan. Angka ini pembagian bawaan dan bisa diatur per kecamatan.',
  },
  {
    q: 'Bagaimana cara masuk?',
    a: 'Cukup masukkan nomor WhatsApp, lalu isi kode OTP yang kami kirim. Tidak ada password yang perlu diingat.',
  },
  {
    q: 'Kenapa perlu verifikasi KTP?',
    a: 'Untuk melamar kerja, membayar, atau menarik dana, kami meminta verifikasi KTP agar penipuan sulit terjadi. Foto KTP disimpan di penyimpanan privat dan hanya dilihat admin untuk verifikasi.',
  },
  {
    q: 'Kapan uang cair?',
    a: 'Dana ditahan MADANI selama pekerjaan berjalan atau barang dikirim. Setelah pembeli mengonfirmasi barang diterima atau pemberi kerja menyatakan pekerjaan selesai, dana masuk ke saldo penerima dan bisa diajukan penarikan.',
  },
  {
    q: 'Bagaimana kalau ada masalah?',
    a: 'Ajukan komplain lewat aplikasi, tim kami akan meninjau dan dana dapat dikembalikan atau dicairkan sesuai hasilnya. Konten atau pengguna mencurigakan bisa dilaporkan lewat tombol Laporkan dan kami tinjau paling lambat 24 jam.',
  },
  {
    q: 'Apakah barang kena ongkir ekspedisi?',
    a: 'Tidak. Barang diantar penjual satu kecamatan, jadi tanpa ongkir ekspedisi. Kesepakatan antar dilakukan lewat chat dengan penjual.',
  },
  {
    q: 'Bisa jadi pembeli sekaligus penjual?',
    a: 'Bisa. Satu akun boleh punya beberapa peran dan kamu tinggal berpindah peran dari menu Akun.',
  },
  {
    q: 'Kecamatanku belum tersedia, bagaimana?',
    a: 'Wilayah ditambahkan oleh tim MADANI. Hubungi kami lewat halaman Kontak untuk mengajukan kecamatanmu.',
  },
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
      className={`tiket relative w-full rounded-md border-[1.5px] border-ink-700 bg-white p-3 sm:p-4 lg:max-w-[15rem] ${className}`}
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
      <h3 className="font-display text-[15px] font-bold leading-snug text-ink-700 sm:text-[17px]">{judul}</h3>
      <p className="mt-1 text-xs text-neutral-500 sm:text-sm">{lokasi}</p>
      <p className="mt-2 inline-block rounded-md bg-sun-400 px-2 py-0.5 text-xs font-bold text-ink-800 sm:mt-3 sm:text-sm">
        {harga}
      </p>
    </article>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect('/beranda');

  return (
    <div className="min-h-screen overflow-x-clip bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-5">
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/madani.png" alt="MADANI" className="h-8 w-auto sm:h-9" />
          </Link>
          <nav className="hidden items-center gap-7 text-[15px] font-medium text-neutral-600 lg:flex">
            <a href="#dua-pasar" className="hover:text-ink-700">Dua pasar</a>
            <a href="#untuk-siapa" className="hover:text-ink-700">Untuk siapa</a>
            <a href="#cara-kerja" className="hover:text-ink-700">Cara kerja</a>
            <a href="#bagi-hasil" className="hover:text-ink-700">Bagi hasil</a>
            <a href="#aman" className="hover:text-ink-700">Keamanan</a>
            <a href="#faq" className="hover:text-ink-700">FAQ</a>
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/login" className="rounded-full px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-neutral-100 sm:px-4 sm:text-[15px]">
              Masuk
            </Link>
            <Link href="/register" className="rounded-full bg-ink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 sm:px-5 sm:text-[15px]">
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-8 sm:px-5 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12 lg:pb-16">
        <div>
          <h1 className="text-[2.1rem] font-extrabold leading-[1.08] text-ink-700 sm:text-5xl lg:text-[4.2rem] lg:leading-[1.02]">
            Kerja dan belanja, sama tetangga sendiri.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            MADANI mempertemukan warga satu kecamatan: lowongan kerja harian dan toko-toko di sekitar
            rumah. Uangnya ditahan aman sampai pekerjaan selesai atau barang sampai.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="rounded-full bg-ink-700 px-7 py-3.5 text-center font-semibold text-white hover:bg-ink-800">
              Daftar gratis
            </Link>
            <Link href="/login" className="rounded-full border-2 border-ink-700 px-7 py-3.5 text-center font-semibold text-ink-700 hover:bg-ink-50">
              Saya sudah punya akun
            </Link>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-neutral-500">
            <Smartphone className="h-4 w-4 shrink-0" />
            Masuk lewat kode WhatsApp, tanpa password.
          </p>
        </div>

        {/* Papan pengumuman */}
        <div
          className="relative grid grid-cols-2 gap-x-3 gap-y-4 rounded-[24px] bg-[#E6F2EA] p-4 pb-5 sm:gap-x-5 sm:gap-y-6 sm:p-8 sm:pb-6 lg:block lg:min-h-[540px] lg:rounded-[28px] lg:p-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(12,42,87,0.16) 1.2px, transparent 1.2px)',
            backgroundSize: '20px 20px',
          }}
        >
          <Tiket tone="kerja" judul="Dicari tukang cat harian" lokasi="Kedaton, 2 jam lalu" harga="Rp150.000 per hari"
            rot="-2deg" delay="80ms" className="lg:absolute lg:left-6 lg:top-10" />
          <Tiket tone="belanja" judul="Nasi uduk dan gorengan, 20 porsi" lokasi="Toko Bu Rina, Rajabasa" harga="Rp12.000"
            rot="2deg" delay="200ms" className="lg:absolute lg:right-6 lg:top-24" />
          <Tiket tone="kerja" judul="Kurir antar sembako, pagi hari" lokasi="Sukarame, kemarin" harga="Rp80.000 per hari"
            rot="1.5deg" delay="320ms" className="lg:absolute lg:left-4 lg:top-[17rem]" />
          <Tiket tone="belanja" judul="Bayam segar, seikat" lokasi="Kebun Pak Slamet, Way Halim" harga="Rp5.000"
            rot="-1.5deg" delay="440ms" className="lg:absolute lg:right-4 lg:top-[19.5rem]" />
          <p className="col-span-2 text-xs text-ink-600/70 lg:absolute lg:bottom-4 lg:left-6 lg:right-6">
            Contoh tampilan papan. Isi sebenarnya dari warga di kecamatanmu.
          </p>
        </div>
      </section>

      {/* Nilai jual */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-5 sm:pb-20">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {NILAI.map((n) => (
            <li key={n.judul} className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
              <n.icon className="h-6 w-6 text-secondary-500" />
              <p className="mt-3 font-display text-base font-bold text-ink-700 sm:text-lg">{n.judul}</p>
              <p className="mt-1 text-sm leading-snug text-neutral-600">{n.isi}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Dua pasar */}
      <section id="dua-pasar" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-5 sm:pb-20">
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-ink-700 md:text-4xl">
          Dua pasar dalam satu aplikasi
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-12">
          <div className="rounded-[24px] bg-secondary-700 p-6 text-white sm:rounded-[28px] md:col-span-7 md:p-10">
            <Briefcase className="h-7 w-7 text-secondary-200" />
            <h3 className="mt-5 text-2xl font-extrabold leading-tight text-white sm:text-3xl">Pasar kerja harian</h3>
            <p className="mt-3 max-w-md text-secondary-100">
              Pasang lowongan atau cari kerja low-skill di kecamatanmu sendiri. Cocok untuk tukang,
              kurir, asisten usaha, dan pekerjaan lain yang dibayar per hari.
            </p>
            <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm font-semibold">
              {['Melamar', 'Diterima', 'Dikerjakan', 'Dibayar'].map((s, i, arr) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1.5">{s}</span>
                  {i < arr.length - 1 && <ChevronRight className="hidden h-4 w-4 text-secondary-200 sm:block" />}
                </li>
              ))}
            </ol>
            <Link href="/kerja" className="mt-7 inline-flex rounded-full bg-white px-5 py-2.5 font-semibold text-secondary-700 hover:bg-secondary-50">
              Lihat lowongan
            </Link>
          </div>

          <div className="rounded-[24px] bg-primary-500 p-6 text-ink-900 sm:rounded-[28px] md:col-span-5 md:p-10">
            <ShoppingBag className="h-7 w-7 text-ink-800" />
            <h3 className="mt-5 text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">Pasar barang sekitar</h3>
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
                <div key={nama} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <dt className="font-medium">{nama}</dt>
                  <dd className="shrink-0 font-bold">{harga}</dd>
                </div>
              ))}
            </dl>
            <Link href="/marketplace" className="mt-7 inline-flex rounded-full bg-ink-800 px-5 py-2.5 font-semibold text-white hover:bg-ink-900">
              Lihat toko sekitar
            </Link>
          </div>
        </div>
      </section>

      {/* Untuk siapa */}
      <section id="untuk-siapa" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-5 sm:pb-20">
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-ink-700 md:text-4xl">
          Satu akun, banyak peran
        </h2>
        <p className="mt-3 max-w-xl text-neutral-600">
          Kamu bisa mencari kerja di pagi hari dan jualan di sore hari. Cukup berpindah peran dari menu Akun.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PERAN.map((p) => (
            <div key={p.judul} className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700">
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-ink-700">{p.judul}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{p.isi}</p>
              <ul className="mt-4 space-y-1.5 border-t border-neutral-100 pt-4 text-sm text-neutral-700">
                {p.poin.map((t) => (
                  <li key={t} className="flex gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/register" className="inline-flex rounded-full bg-ink-700 px-7 py-3.5 font-semibold text-white hover:bg-ink-800">
            Pilih perananmu, daftar gratis
          </Link>
        </div>
      </section>

      {/* Cara kerja */}
      <section id="cara-kerja" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-5 sm:pb-24">
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-ink-700 md:text-4xl">
          Empat langkah, langsung jalan
        </h2>
        <ol className="mt-10 grid gap-7 md:grid-cols-4 md:gap-6">
          {LANGKAH.map((l, i) => (
            <li
              key={l.judul}
              className="relative flex gap-4 md:block md:after:absolute md:after:left-14 md:after:right-0 md:after:top-[22px] md:after:h-[2px] md:after:bg-ink-200 md:last:after:hidden"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-700 font-display text-lg font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-bold text-ink-700 md:mt-4">{l.judul}</h3>
                <p className="mt-1 max-w-[18rem] text-neutral-600 md:mt-1.5">{l.isi}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Fitur */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-5 sm:pb-24">
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-ink-700 md:text-4xl">
          Yang kamu butuhkan, sudah ada
        </h2>
        <ul className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {FITUR.map((f) => (
            <li key={f.judul} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sun-400/30 text-ink-800">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-bold text-ink-700">{f.judul}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{f.isi}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Bagi hasil */}
      <section id="bagi-hasil" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-5 sm:pb-24">
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight text-ink-700 md:text-4xl">
          Setiap transaksi, tiga pihak ikut kebagian
        </h2>
        <p className="mt-3 max-w-xl text-neutral-600">
          Keuntungan tidak berhenti di platform. Sebagian kembali ke kecamatan tempat transaksi terjadi.
        </p>

        <div className="mt-8 flex h-12 overflow-hidden rounded-full border-2 border-ink-700 sm:mt-10 sm:h-14">
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

      {/* Mitra kecamatan */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-5 sm:pb-24">
        <div className="grid gap-6 rounded-[24px] bg-ink-50 p-6 sm:rounded-[28px] sm:p-10 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <Landmark className="h-7 w-7 text-secondary-700" />
            <h2 className="mt-4 text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl">
              Punya komunitas atau kantor kecamatan?
            </h2>
            <p className="mt-3 max-w-xl text-neutral-600">
              Jadi mitra MADANI. Setiap transaksi di wilayahmu menyumbang bagian untuk kecamatan, dan
              kamu bisa memantau ringkasan aktivitasnya lewat dashboard kecamatan di aplikasi.
            </p>
          </div>
          <div className="md:justify-self-end">
            <a
              href="mailto:info@rhgteknologiindonesia.id?subject=Mitra%20Kecamatan%20MADANI"
              className="inline-flex rounded-full bg-ink-700 px-7 py-3.5 font-semibold text-white hover:bg-ink-800"
            >
              Ajukan kecamatanmu
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-16 sm:px-5 sm:pb-24">
        <h2 className="text-3xl font-extrabold leading-tight text-ink-700 md:text-4xl">Pertanyaan yang sering muncul</h2>
        <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-display text-lg font-bold text-ink-700 [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 pr-8 leading-relaxed text-neutral-600">{f.a}</p>
            </details>
          ))}
          <details className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-display text-lg font-bold text-ink-700 [&::-webkit-details-marker]:hidden">
              <span>Bagaimana cara menghapus akun?</span>
              <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-4 pr-8 leading-relaxed text-neutral-600">
              Buka menu Akun di aplikasi lalu pilih Hapus akun saya, atau kunjungi halaman{' '}
              <Link href="/hapus-akun" className="font-semibold text-secondary-700 underline">Hapus Akun</Link>.
              Penjelasan lengkap ada di{' '}
              <Link href="/privasi" className="font-semibold text-secondary-700 underline">Kebijakan Privasi</Link>.
            </p>
          </details>
        </div>
      </section>

      {/* Keamanan */}
      <section id="aman" className="scroll-mt-20 rounded-t-[32px] bg-ink-700 text-white sm:rounded-t-[40px]">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-5 sm:py-20 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="text-3xl font-extrabold leading-[1.1] text-white sm:text-4xl md:text-5xl">
              Uangmu ditahan sampai kerjaannya selesai.
            </h2>
            <ol className="mt-8 space-y-5 sm:mt-10">
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
              <li key={k.judul} className="flex gap-4 py-5 sm:py-6">
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
      <section className="bg-ink-700 pb-16 pt-2 text-white sm:pb-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:px-5 md:flex-row md:items-center">
          <div>
            <h2 className="max-w-xl text-3xl font-extrabold leading-tight text-white md:text-4xl">
              Mulai dari kecamatanmu sendiri.
            </h2>
            <p className="mt-3 max-w-xl text-white/70">
              Aplikasi Android dan iOS sedang disiapkan. Sementara itu, MADANI sudah bisa dipakai lewat
              browser di HP maupun laptop.
            </p>
          </div>
          <Link href="/register" className="w-full rounded-full bg-primary-400 px-8 py-4 text-center font-semibold text-ink-900 hover:bg-primary-300 md:w-auto">
            Daftar gratis
          </Link>
        </div>
      </section>
    </div>
  );
}