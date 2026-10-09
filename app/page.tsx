import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { createClient } from '@supabase/supabase-js';
import {
  Briefcase, ShoppingBag, Smartphone, UserCheck, ScrollText, ChevronRight, ChevronDown,
  Search, Megaphone, Store, MessageCircle, Bell, Star, Wallet, LifeBuoy, MapPin,
  ShieldCheck, BadgeCheck, Landmark, Hammer, Truck, Sprout, GraduationCap, Lock,
  Flag, Ban, Eye, Users, Receipt, Trash2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '#layanan', label: 'Layanan' },
  { href: '#katalog', label: 'Katalog' },
  { href: '#untuk-siapa', label: 'Untuk siapa' },
  { href: '#cara-kerja', label: 'Cara kerja' },
  { href: '#aman', label: 'Keamanan' },
  { href: '#faq', label: 'FAQ' },
];

const NILAI = [
  { icon: BadgeCheck, judul: 'Daftar gratis', isi: 'Buka toko dan melamar kerja tanpa biaya daftar.' },
  { icon: MapPin, judul: 'Dekat rumah', isi: 'Lowongan dan toko dari warga satu kecamatan.' },
  { icon: Smartphone, judul: 'Tanpa password', isi: 'Masuk dengan kode yang dikirim ke WhatsApp.' },
  { icon: Receipt, judul: 'Tercatat jelas', isi: 'Pesanan dan pekerjaan punya status yang bisa dilihat.' },
];

const PERAN = [
  {
    icon: Search,
    judul: 'Pencari kerja',
    isi: 'Cari pekerjaan harian dekat rumah dan lamar langsung dari HP.',
    poin: ['Lowongan di kecamatanmu', 'Lamar kapan saja dari HP', 'Rating membangun reputasimu'],
  },
  {
    icon: Megaphone,
    judul: 'Pemberi kerja',
    isi: 'Pasang lowongan, pilih pekerja yang cocok, dan pantau pekerjaannya.',
    poin: ['Posting dalam hitungan menit', 'Bandingkan para pelamar', 'Status pekerjaan jelas'],
  },
  {
    icon: Store,
    judul: 'Penjual',
    isi: 'Buka toko gratis dan jual barang ke tetangga satu kecamatan.',
    poin: ['Kelola produk dan stok', 'Terima dan proses pesanan', 'Pantau pesanan dan saldo'],
  },
  {
    icon: ShoppingBag,
    judul: 'Pembeli',
    isi: 'Belanja dari toko sekitar dan tanya langsung ke penjualnya.',
    poin: ['Keranjang dan pesanan', 'Chat dengan penjual', 'Beri ulasan setelah terima'],
  },
];

const CERITA = [
  {
    icon: Hammer,
    nama: 'Tukang bangunan',
    isi: 'Melihat lowongan renovasi di kecamatan sebelah, melamar dari HP, lalu membahas jadwal lewat chat.',
  },
  {
    icon: Store,
    nama: 'Ibu penjual nasi uduk',
    isi: 'Membuka toko gratis, memasang foto dagangan, dan menerima pesanan dari tetangga.',
  },
  {
    icon: GraduationCap,
    nama: 'Mahasiswa',
    isi: 'Mengambil kerja kurir sembako di pagi hari sebelum berangkat kuliah.',
  },
  {
    icon: Sprout,
    nama: 'Petani sayur',
    isi: 'Menjual hasil kebun langsung ke warga sekitar, tanpa ongkir ekspedisi.',
  },
];

const ALUR_KERJA = [
  { judul: 'Daftar dan pilih peran', isi: 'Masuk dengan kode WhatsApp, lalu pilih pencari kerja atau pemberi kerja.' },
  { judul: 'Cari atau pasang lowongan', isi: 'Pencari kerja melamar. Pemberi kerja menulis judul, upah, dan lokasi.' },
  { judul: 'Pilih pelamar', isi: 'Pemberi kerja memilih satu pelamar yang paling cocok.' },
  { judul: 'Kerjakan dan tetap terhubung', isi: 'Koordinasi jadwal dan lokasi lewat chat di dalam aplikasi.' },
  { judul: 'Selesai dan beri rating', isi: 'Pemberi kerja menandai selesai, lalu kedua pihak saling menilai.' },
];

const ALUR_BELANJA = [
  { judul: 'Daftar dan pilih peran', isi: 'Pilih pembeli, penjual, atau keduanya.' },
  { judul: 'Penjual membuka toko', isi: 'Isi nama toko, tambah produk, foto, harga, dan stok.' },
  { judul: 'Pembeli memesan', isi: 'Pilih produk, masukkan keranjang, lalu checkout.' },
  { judul: 'Pesanan diproses', isi: 'Penjual menyiapkan dan mengantar pesanan ke pembeli.' },
  { judul: 'Terima dan beri ulasan', isi: 'Pembeli mengonfirmasi barang diterima dan boleh menulis ulasan.' },
];

const FITUR = [
  { icon: MapPin, judul: 'Papan per kecamatan', isi: 'Lowongan dan toko yang tampil adalah milik warga di wilayahmu.' },
  { icon: MessageCircle, judul: 'Chat langsung', isi: 'Tanya penjual atau ngobrol dengan pemberi kerja sebelum sepakat.' },
  { icon: Bell, judul: 'Notifikasi', isi: 'Pesan, pesanan, dan lamaran baru masuk ke HP-mu.' },
  { icon: Star, judul: 'Ulasan dan rating', isi: 'Penilaian dari pengguna lain membantu memilih dengan yakin.' },
  { icon: Wallet, judul: 'Saldo dan riwayat', isi: 'Lihat saldo dan riwayat transaksimu di satu halaman.' },
  { icon: LifeBuoy, judul: 'Komplain dan bantuan', isi: 'Ada masalah? Ajukan komplain, tim kami bantu tinjau.' },
  { icon: UserCheck, judul: 'Verifikasi KTP', isi: 'Foto KTP dipakai untuk verifikasi dan disimpan di tempat privat.' },
  { icon: Ban, judul: 'Lapor dan blokir', isi: 'Laporkan konten bermasalah atau blokir pengguna dari menu titik tiga.' },
  { icon: Eye, judul: 'Lihat dulu, daftar belakangan', isi: 'Jelajahi lowongan dan produk tanpa harus login lebih dulu.' },
];

const AMAN = [
  { icon: UserCheck, judul: 'Verifikasi KTP', isi: 'Fitur seperti melamar kerja dan penarikan saldo meminta verifikasi KTP lebih dulu.' },
  { icon: Smartphone, judul: 'Masuk lewat WhatsApp', isi: 'Kode sekali pakai dikirim ke nomormu, jadi tidak ada password yang bisa bocor.' },
  { icon: Flag, judul: 'Laporan ditinjau', isi: 'Laporan konten atau pengguna mencurigakan kami tinjau paling lambat 24 jam.' },
  { icon: Ban, judul: 'Blokir pengguna', isi: 'Pengguna yang tidak ingin kamu temui bisa diblokir kapan saja.' },
  { icon: ScrollText, judul: 'Aktivitas tercatat', isi: 'Setiap transaksi punya catatan yang bisa diperiksa kalau ada perselisihan.' },
  { icon: Trash2, judul: 'Hapus akun kapan saja', isi: 'Kamu bisa menghapus akun sendiri dari menu Akun atau halaman Hapus Akun.' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Apakah MADANI gratis?',
    a: 'Daftar dan membuka toko gratis. Pada transaksi, ada pembagian bawaan: 10% untuk platform, 80% untuk pekerja atau penjual, dan 10% untuk kecamatan. Angka ini bisa diatur per kecamatan.',
  },
  {
    q: 'Bagaimana cara masuk?',
    a: 'Masukkan nomor WhatsApp, lalu isi kode OTP yang kami kirim. Tidak ada password yang perlu diingat.',
  },
  {
    q: 'Apakah harus pasang aplikasi?',
    a: 'Tidak harus. MADANI bisa dipakai lewat browser di HP maupun laptop. Aplikasi Android dan iOS sedang disiapkan.',
  },
  {
    q: 'Kenapa perlu verifikasi KTP?',
    a: 'Untuk melamar kerja, membayar, atau menarik saldo, kami meminta verifikasi KTP supaya penipuan sulit terjadi. Foto KTP disimpan di penyimpanan privat dan hanya dilihat admin untuk verifikasi.',
  },
  {
    q: 'Kapan sebuah transaksi dianggap selesai?',
    a: 'Untuk pesanan barang, setelah pembeli mengonfirmasi barang diterima. Untuk pekerjaan, setelah pemberi kerja menandai pekerjaan selesai. Setelah itu kedua pihak bisa saling memberi penilaian.',
  },
  {
    q: 'Bagaimana dengan pembayaran dan saldo?',
    a: 'Fitur pembayaran dan saldo saat ini masih dalam tahap uji coba bertahap. Metode pembayaran resmi akan diumumkan setelah aktif.',
  },
  {
    q: 'Bagaimana kalau ada masalah?',
    a: 'Ajukan komplain lewat aplikasi, tim kami akan meninjau dan membantu menyelesaikannya. Konten atau pengguna mencurigakan bisa dilaporkan lewat tombol Laporkan.',
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
  {
    q: 'Apakah data pribadiku aman?',
    a: 'Data dipakai hanya untuk menjalankan layanan. Foto KTP disimpan di penyimpanan privat. Penjelasan lengkap ada di halaman Kebijakan Privasi.',
  },
];

/* ---------- Katalog publik (bisa dilihat tanpa login) ---------- */

type Relasi<T> = T | T[] | null;
type Lowongan = {
  id: string;
  judul: string;
  upah: number | null;
  created_at: string | null;
  kategori: Relasi<{ nama: string }>;
  kecamatan: Relasi<{ nama: string }>;
};
type ProdukRingkas = {
  id: string;
  nama: string;
  harga: number | null;
  stok: number | null;
  foto_url: string | string[] | null;
  toko: Relasi<{ nama_toko: string }>;
};

// Ubah dua baris ini kalau rute detail di web berbeda (nanti saya sesuaikan).
const hrefLowongan = (id: string) => `/lowongan/${id}`;
const hrefProduk = (id: string) => `/produk/${id}`;

function satu<T>(v: Relasi<T>): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function rupiah(n: number | null) {
  return `Rp${Math.round(n ?? 0).toLocaleString('id-ID')}`;
}

function waktuRelatif(iso: string | null) {
  if (!iso) return '';
  const menit = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (menit < 1) return 'baru saja';
  if (menit < 60) return `${menit} mnt lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function fotoPertama(v: string | string[] | null): string | null {
  const f = Array.isArray(v) ? v[0] : v;
  return f && f.startsWith('http') ? f : null;
}

async function muatPublik() {
  const kosong = { lowongan: [] as Lowongan[], produk: [] as ProdukRingkas[] };
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return kosong;

    const sb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [t, p] = await Promise.all([
      sb
        .from('tasks')
        .select('id, judul, upah, created_at, kategori(nama), kecamatan(nama)')
        .eq('status', 'terbuka')
        .order('created_at', { ascending: false })
        .limit(6),
      sb
        .from('produk')
        .select('id, nama, harga, stok, foto_url, toko(nama_toko)')
        .eq('status', 'aktif')
        .order('created_at', { ascending: false })
        .limit(8),
    ]);
    if (t.error) console.error('[landing] tasks:', t.error.message);
    if (p.error) console.error('[landing] produk:', p.error.message);

    return {
      lowongan: (t.data ?? []) as unknown as Lowongan[],
      produk: (p.data ?? []) as unknown as ProdukRingkas[],
    };
  } catch (e) {
    console.error('[landing] gagal memuat katalog:', e);
    return kosong;
  }
}

/* ---------- Kartu contoh di papan hero ---------- */

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

/* ---------- Animasi warga berlari di desa (CSS murni) ---------- */

const INK = '#0C2A57';

function Koin({ x, y, d }: { x: number; y: number; d: number }) {
  return (
    <g className="desa-koin" style={{ animationDelay: `${d}ms` }}>
      <circle cx={x} cy={y} r={6} fill="#FFC83D" stroke={INK} strokeWidth={1.6} />
      <rect x={x - 1} y={y - 3} width={2} height={6} fill="#F59E0B" />
    </g>
  );
}

function Rumah({ x, w = 64, dinding, atap }: { x: number; w?: number; dinding: string; atap: string }) {
  const y = 120;
  return (
    <g stroke={INK} strokeWidth={1.6} strokeLinejoin="round">
      <rect x={x} y={y} width={w} height={40} fill={dinding} />
      <polygon points={`${x - 8},${y} ${x + w / 2},${y - 32} ${x + w + 8},${y}`} fill={atap} />
      <rect x={x + w / 2 - 8} y={y + 16} width={16} height={24} fill="#7A4B2A" />
      <rect x={x + 8} y={y + 10} width={12} height={12} fill="#8FD0E8" />
      <rect x={x + w - 20} y={y + 10} width={12} height={12} fill="#8FD0E8" />
    </g>
  );
}

function Palem({ x }: { x: number }) {
  return (
    <g stroke={INK} strokeWidth={1.6} strokeLinejoin="round">
      <rect x={x - 4} y={92} width={8} height={68} fill="#8B5E3C" />
      <path d={`M${x} 96 C${x - 18} 80 ${x - 36} 90 ${x - 40} 104 C${x - 24} 96 ${x - 12} 98 ${x} 100Z`} fill="#2E8B57" />
      <path d={`M${x} 96 C${x + 18} 80 ${x + 36} 90 ${x + 40} 104 C${x + 24} 96 ${x + 12} 98 ${x} 100Z`} fill="#2E8B57" />
      <path d={`M${x} 96 C${x - 12} 72 ${x + 12} 72 ${x} 96Z`} fill="#3FA05C" />
    </g>
  );
}

function LapisJauh() {
  return (
    <svg viewBox="0 0 800 200" aria-hidden>
      <g fill="#FFFFFF" opacity={0.95}>
        {[
          [60, 34],
          [330, 52],
          [590, 28],
        ].map(([cx, cy]) => (
          <g key={cx}>
            <rect x={cx} y={cy} width={56} height={14} rx={7} />
            <rect x={cx + 10} y={cy - 8} width={30} height={14} rx={7} />
          </g>
        ))}
      </g>
      <path d="M0 150 C100 100 200 110 300 140 S500 100 600 130 S750 120 800 150 L800 200 L0 200Z" fill="#9ACFB0" />
      <path d="M0 170 C120 130 260 150 400 165 S650 140 800 170 L800 200 L0 200Z" fill="#86C39B" />
    </svg>
  );
}

function LapisTengah() {
  return (
    <svg viewBox="0 0 800 200" aria-hidden>
      <rect x={0} y={152} width={800} height={14} fill="#86CC72" />
      <path d="M0 157H800M0 162H800" stroke="#6DB85E" strokeWidth={2} />
      <Rumah x={40} dinding="#F4E3C1" atap="#C2553A" />
      <Palem x={190} />
      {/* warung */}
      <g stroke={INK} strokeWidth={1.6} strokeLinejoin="round">
        <rect x={300} y={128} width={72} height={32} fill="#F9D56E" />
        <polygon points="292,128 380,128 372,110 300,110" fill="#E4572E" />
        <path d="M312 110L308 128M328 110L326 128M344 110L344 128M360 110L362 128" stroke="#FFFFFF" strokeWidth={3} />
        <rect x={312} y={138} width={20} height={22} fill="#7A4B2A" />
        <rect x={342} y={136} width={20} height={12} fill="#8FD0E8" />
      </g>
      <Rumah x={450} w={76} dinding="#DCEFD8" atap="#8A4B2F" />
      {/* pohon mangga */}
      <g stroke={INK} strokeWidth={1.6}>
        <rect x={606} y={120} width={8} height={40} fill="#8B5E3C" />
        <circle cx={610} cy={106} r={24} fill="#3FA05C" />
        <circle cx={592} cy={116} r={15} fill="#4DB36A" />
        <circle cx={628} cy={116} r={15} fill="#4DB36A" />
      </g>
      <Palem x={722} />
    </svg>
  );
}

function Papan({ x, label }: { x: number; label: string }) {
  return (
    <g stroke={INK} strokeWidth={1.6} strokeLinejoin="round">
      <rect x={x - 3} y={132} width={6} height={30} fill="#8B5E3C" />
      <rect x={x - 42} y={112} width={84} height={24} rx={3} fill="#FFFFFF" />
      <text
        x={x}
        y={128}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill={INK}
        stroke="none"
      >
        {label}
      </text>
    </g>
  );
}

function LapisDekat() {
  return (
    <svg viewBox="0 0 800 200" aria-hidden>
      <rect x={0} y={164} width={800} height={36} fill="#C99A63" />
      <rect x={0} y={159} width={800} height={7} fill="#4FA85A" />
      <path d="M0 186H800" stroke="#B88650" strokeWidth={2} strokeDasharray="24 16" />
      <g fill="#3F8F4B">
        {[60, 170, 280, 400, 510, 620, 770].map((x) => (
          <path key={x} d={`M${x} 160 l3 -9 l3 9 l3 -7 l3 7Z`} />
        ))}
      </g>
      <Papan x={120} label="1 Daftar" />
      <Papan x={330} label="2 Pilih peran" />
      <Papan x={540} label="3 Cari atau jual" />
      <Papan x={740} label="4 Selesai" />
      {/* koin */}
      <Koin x={215} y={126} d={0} />
      <Koin x={236} y={116} d={150} />
      <Koin x={257} y={126} d={300} />
      {/* kotak bata */}
      <g stroke={INK} strokeWidth={1.6}>
        <rect x={420} y={88} width={48} height={12} fill="#C2553A" />
        <path d="M436 88V100M452 88V100" />
      </g>
      <Koin x={430} y={118} d={100} />
      <Koin x={444} y={110} d={250} />
      <Koin x={458} y={118} d={400} />
      <Koin x={635} y={126} d={50} />
      <Koin x={656} y={116} d={200} />
      <Koin x={677} y={126} d={350} />
    </svg>
  );
}

function Pelari() {
  return (
    <svg viewBox="0 0 16 23" shapeRendering="crispEdges" className="desa-badan h-full w-auto" aria-hidden>
      <ellipse cx="8" cy="22.4" rx="6" ry="0.7" fill="rgba(12,42,87,0.2)" />
      {/* tas */}
      <rect x="1" y="9" width="3" height="5" fill="#C2553A" />
      {/* tangan belakang */}
      <g className="desa-tangan">
        <rect x="5" y="9" width="2" height="5" fill="#C98E5E" />
      </g>
      {/* kaki */}
      <g className="desa-kaki-a">
        <rect x="5" y="15" width="3" height="6" fill="#3A4A7A" />
        <rect x="5" y="21" width="4" height="1" fill="#4A2C17" />
      </g>
      <g className="desa-kaki-b">
        <rect x="8" y="15" width="3" height="6" fill="#2C3A66" />
        <rect x="8" y="21" width="4" height="1" fill="#4A2C17" />
      </g>
      {/* badan */}
      <rect x="4" y="9" width="8" height="6" fill="#2F8F5B" />
      <rect x="5" y="11" width="2" height="2" fill="#7DD3A0" />
      {/* kepala */}
      <rect x="4" y="4" width="8" height="5" fill="#E0A878" />
      <rect x="9" y="6" width="1" height="1" fill="#2B1B0E" />
      <rect x="10" y="8" width="2" height="1" fill="#B9774A" />
      {/* caping */}
      <rect x="7" y="0" width="2" height="1" fill="#E8C060" />
      <rect x="5" y="1" width="6" height="1" fill="#E8C060" />
      <rect x="3" y="2" width="10" height="1" fill="#E8C060" />
      <rect x="1" y="3" width="14" height="1" fill="#C9A24A" />
      {/* tangan depan */}
      <g className="desa-tangan-d">
        <rect x="10" y="9" width="2" height="5" fill="#E0A878" />
      </g>
    </svg>
  );
}

function Desa() {
  return (
    <div
      className="relative h-[210px] overflow-hidden rounded-[24px] border-2 border-ink-700 sm:h-[280px] sm:rounded-[28px] lg:h-[330px]"
      style={{ background: 'linear-gradient(180deg,#BFE6F5 0%,#E4F6EE 62%,#F3FAEA 100%)' }}
      role="img"
      aria-label="Ilustrasi warga desa berlari melewati rumah dan warung, menuju empat langkah memakai MADANI"
    >
      <span
        aria-hidden
        className="absolute right-5 top-4 h-10 w-10 rounded-full border-2 border-ink-700 bg-[#FFD54A] sm:h-14 sm:w-14"
      />
      <div aria-hidden className="absolute inset-0">
        <div className="desa-lapis" style={{ '--dur': '110s' } as React.CSSProperties}>
          <LapisJauh />
          <LapisJauh />
        </div>
      </div>
      <div aria-hidden className="absolute inset-0">
        <div className="desa-lapis" style={{ '--dur': '55s' } as React.CSSProperties}>
          <LapisTengah />
          <LapisTengah />
        </div>
      </div>
      <div aria-hidden className="absolute inset-0">
        <div className="desa-lapis" style={{ '--dur': '20s' } as React.CSSProperties}>
          <LapisDekat />
          <LapisDekat />
        </div>
      </div>
      <div aria-hidden className="absolute bottom-[17%] left-[14%] h-[36%] sm:left-[22%]">
        <Pelari />
      </div>
      <span aria-hidden className="desa-pop absolute bottom-[56%] left-[17%] sm:left-[25%]">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="#FFC83D" stroke={INK} strokeWidth="2" />
          <rect x="9" y="5" width="2" height="10" fill="#F59E0B" />
        </svg>
      </span>
    </div>
  );
}

/* ---------- Halaman ---------- */

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect('/beranda');
  const { lowongan, produk } = await muatPublik();

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
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-ink-700">
                {n.label}
              </a>
            ))}
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
        <nav className="border-t border-neutral-100 lg:hidden">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2 text-sm font-medium text-neutral-600 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5">
                {n.label}
              </a>
            ))}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-8 sm:px-5 md:pt-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12 lg:pb-16">
        <div>
          <h1
            className="desa-naik text-[2rem] font-extrabold leading-[1.1] text-ink-700 sm:text-5xl lg:text-[3.8rem] lg:leading-[1.04]"
            style={{ '--d': '0ms' } as React.CSSProperties}
          >
            Cari kerja, jualan, dan belanja di kecamatanmu sendiri.
          </h1>
          <p
            className="desa-naik mt-5 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg"
            style={{ '--d': '120ms' } as React.CSSProperties}
          >
            MADANI adalah aplikasi untuk warga satu kecamatan. Cari kerja harian, pasang lowongan,
            buka toko, atau belanja dari tetangga, semuanya di satu tempat.
          </p>
          <div
            className="desa-naik mt-7 flex flex-col gap-3 sm:flex-row"
            style={{ '--d': '240ms' } as React.CSSProperties}
          >
            <Link href="/register" className="rounded-full bg-ink-700 px-7 py-3.5 text-center font-semibold text-white hover:bg-ink-800">
              Daftar gratis
            </Link>
            <Link href="/login" className="rounded-full border-2 border-ink-700 px-7 py-3.5 text-center font-semibold text-ink-700 hover:bg-ink-50">
              Saya sudah punya akun
            </Link>
          </div>
          <p
            className="desa-naik mt-5 flex items-center gap-2 text-sm text-neutral-500"
            style={{ '--d': '360ms' } as React.CSSProperties}
          >
            <Smartphone className="h-4 w-4 shrink-0" />
            Masuk lewat kode WhatsApp, tanpa password.
          </p>
          <p className="mt-2 text-sm">
            <a href="#katalog" className="font-semibold text-secondary-700 underline">
              Lihat lowongan dan produk tanpa login
            </a>
          </p>
        </div>

        {/* Contoh tampilan */}
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
            Contoh tampilan. Isi sebenarnya dari warga di kecamatanmu.
          </p>
        </div>
      </section>

      {/* Nilai jual */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-5 sm:pb-20">
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

      {/* Animasi desa */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-5 sm:pb-20">
        <h2 className="max-w-2xl text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl md:text-4xl">
          Dari daftar sampai selesai, semuanya di satu aplikasi
        </h2>
        <p className="mt-3 max-w-xl text-neutral-600">
          Empat langkah sederhana untuk mulai bekerja, berjualan, atau belanja di kecamatanmu.
        </p>
        <div className="mt-6 sm:mt-8">
          <Desa />
        </div>
        <ol className="mt-5 grid grid-cols-2 gap-2 text-sm font-semibold text-ink-700 sm:grid-cols-4 sm:gap-3">
          {['Daftar', 'Pilih peran', 'Cari atau jual', 'Selesai'].map((s, i) => (
            <li key={s} className="flex items-center gap-2 rounded-full bg-ink-50 px-3 py-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs text-white">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      {/* Layanan */}
      <section id="layanan" className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-14 sm:px-5 sm:pb-20">
        <h2 className="max-w-2xl text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl md:text-4xl">
          Dua layanan dalam satu aplikasi
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-12">
          <div className="rounded-[24px] bg-secondary-700 p-6 text-white sm:rounded-[28px] md:col-span-7 md:p-10">
            <Briefcase className="h-7 w-7 text-secondary-200" />
            <h3 className="mt-5 text-2xl font-extrabold leading-tight text-white sm:text-3xl">Kerja harian</h3>
            <p className="mt-3 max-w-md text-secondary-100">
              Pasang lowongan atau cari kerja di kecamatanmu sendiri. Cocok untuk tukang, kurir,
              asisten usaha, dan pekerjaan lain yang dibayar per hari.
            </p>
            <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm font-semibold">
              {['Melamar', 'Diterima', 'Dikerjakan', 'Selesai'].map((s, i, arr) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1.5">{s}</span>
                  {i < arr.length - 1 && <ChevronRight className="hidden h-4 w-4 text-secondary-200 sm:block" />}
                </li>
              ))}
            </ol>
            <Link href="/lowongan" className="mt-7 inline-flex rounded-full bg-white px-5 py-2.5 font-semibold text-secondary-700 hover:bg-secondary-50">
              Lihat lowongan
            </Link>
          </div>

          <div className="rounded-[24px] bg-primary-500 p-6 text-ink-900 sm:rounded-[28px] md:col-span-5 md:p-10">
            <ShoppingBag className="h-7 w-7 text-ink-800" />
            <h3 className="mt-5 text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">Belanja sekitar</h3>
            <p className="mt-3 text-ink-800">
              Buka toko gratis atau belanja dari penjual satu kecamatan. Barang diantar penjual,
              tanpa ongkir ekspedisi.
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
            <p className="mt-2 text-xs text-ink-800/70">Contoh produk dan harga.</p>
            <Link href="/produk" className="mt-5 inline-flex rounded-full bg-ink-800 px-5 py-2.5 font-semibold text-white hover:bg-ink-900">
              Lihat toko sekitar
            </Link>
          </div>
        </div>
      </section>

      {/* Katalog publik: bisa dilihat tanpa login */}
      <section id="katalog" className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-14 sm:px-5 sm:pb-20">
        <h2 className="max-w-2xl text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl md:text-4xl">
          Lihat dulu, tanpa perlu login
        </h2>
        <p className="mt-3 max-w-xl text-neutral-600">
          Lowongan dan produk terbaru dari warga sekitar. Kamu baru perlu daftar saat mau melamar atau memesan.
        </p>

        <div className="mt-8 flex items-end justify-between gap-3">
          <h3 className="font-display text-xl font-bold text-ink-700">Lowongan terbaru</h3>
          <Link href="/lowongan" className="shrink-0 text-sm font-semibold text-secondary-700 hover:underline">
            Lihat semua
          </Link>
        </div>
        {lowongan.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-ink-50 p-5 text-neutral-600">
            Belum ada lowongan terbuka saat ini. Coba lihat lagi nanti, atau daftar untuk memasang lowongan pertamamu.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowongan.map((t) => {
              const info = [satu(t.kategori)?.nama, satu(t.kecamatan)?.nama].filter(Boolean).join(' · ');
              return (
                <li key={t.id}>
                  <Link
                    href={hrefLowongan(t.id)}
                    className="block h-full rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-ink-700"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700">
                        <Briefcase className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-display text-base font-bold leading-snug text-ink-700">{t.judul}</p>
                        {info && <p className="mt-1 truncate text-sm text-neutral-500">{info}</p>}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="rounded-md bg-sun-400 px-2 py-0.5 text-sm font-bold text-ink-800">{rupiah(t.upah)}</span>
                      <span className="text-xs text-neutral-500">{waktuRelatif(t.created_at)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-10 flex items-end justify-between gap-3">
          <h3 className="font-display text-xl font-bold text-ink-700">Produk terbaru</h3>
          <Link href="/produk" className="shrink-0 text-sm font-semibold text-secondary-700 hover:underline">
            Lihat semua
          </Link>
        </div>
        {produk.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-ink-50 p-5 text-neutral-600">
            Belum ada produk saat ini. Coba lihat lagi nanti, atau daftar untuk membuka tokomu.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {produk.map((p) => {
              const foto = fotoPertama(p.foto_url);
              const habis = (p.stok ?? 0) <= 0;
              return (
                <li key={p.id}>
                  <Link
                    href={hrefProduk(p.id)}
                    className="block h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-ink-700"
                  >
                    <div className="relative aspect-square bg-ink-50">
                      {foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={foto} alt={p.nama} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-neutral-400">
                          <ShoppingBag className="h-8 w-8" />
                        </span>
                      )}
                      {habis && (
                        <span className="absolute left-2 top-2 rounded bg-white px-2 py-0.5 text-xs font-semibold text-neutral-600">
                          Habis
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-bold leading-snug text-ink-700">{p.nama}</p>
                      <p className="mt-1 font-display text-base font-bold text-ink-700">{rupiah(p.harga)}</p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">{satu(p.toko)?.nama_toko ?? ''}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-8">
          <Link href="/register" className="inline-flex w-full justify-center rounded-full bg-ink-700 px-7 py-3.5 font-semibold text-white hover:bg-ink-800 sm:w-auto">
            Mau melamar atau memesan? Daftar gratis
          </Link>
        </div>
      </section>

      {/* Untuk siapa */}
      <section id="untuk-siapa" className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-14 sm:px-5 sm:pb-20">
        <h2 className="max-w-2xl text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl md:text-4xl">
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
          <Link href="/register" className="inline-flex w-full justify-center rounded-full bg-ink-700 px-7 py-3.5 font-semibold text-white hover:bg-ink-800 sm:w-auto">
            Pilih perananmu, daftar gratis
          </Link>
        </div>
      </section>

      {/* Contoh penggunaan */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-5 sm:pb-20">
        <h2 className="max-w-2xl text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl md:text-4xl">
          Bagaimana warga memakainya
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CERITA.map((c) => (
            <div key={c.nama} className="rounded-2xl bg-ink-50 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-ink-700">
                <c.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-lg font-bold text-ink-700">{c.nama}</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{c.isi}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-neutral-500">Contoh ilustrasi, bukan cerita pengguna nyata.</p>
      </section>

      {/* Cara kerja */}
      <section id="cara-kerja" className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-14 sm:px-5 sm:pb-24">
        <h2 className="max-w-2xl text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl md:text-4xl">
          Cara memakainya, langkah demi langkah
        </h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {[
            { judul: 'Untuk kerja', icon: Briefcase, langkah: ALUR_KERJA, warna: 'bg-secondary-500' },
            { judul: 'Untuk belanja dan jualan', icon: ShoppingBag, langkah: ALUR_BELANJA, warna: 'bg-primary-500' },
          ].map((alur) => (
            <div key={alur.judul} className="rounded-[24px] border border-neutral-200 p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${alur.warna} text-white`}>
                  <alur.icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-xl font-bold text-ink-700">{alur.judul}</h3>
              </div>
              <ol className="mt-6 space-y-5">
                {alur.langkah.map((l, i) => (
                  <li key={l.judul} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-ink-700">{l.judul}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">{l.isi}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Fitur */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-5 sm:pb-24">
        <h2 className="max-w-2xl text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl md:text-4xl">
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

      {/* Pembagian */}
      <section id="bagi-hasil" className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-14 sm:px-5 sm:pb-24">
        <h2 className="max-w-2xl text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl md:text-4xl">
          Manfaatnya juga kembali ke kecamatan
        </h2>
        <p className="mt-3 max-w-xl text-neutral-600">
          Setiap transaksi punya pembagian bawaan, dan sebagian untuk kecamatan tempat transaksi terjadi.
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
              <dt className="font-display text-xl font-bold text-ink-700">10% Layanan platform</dt>
              <dd className="text-neutral-600">Untuk menjalankan dan mengembangkan MADANI.</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-primary-500" />
            <div>
              <dt className="font-display text-xl font-bold text-ink-700">80% Pekerja atau penjual</dt>
              <dd className="text-neutral-600">Yang mengerjakan atau menjual barangnya mendapat bagian terbesar.</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-secondary-500" />
            <div>
              <dt className="font-display text-xl font-bold text-ink-700">10% Kas kecamatan</dt>
              <dd className="text-neutral-600">Kembali ke wilayah tempat transaksi terjadi.</dd>
            </div>
          </div>
        </dl>
        <p className="mt-6 text-sm text-neutral-500">
          Contoh pembagian bawaan. Persentasenya bisa diatur per kecamatan.
        </p>
      </section>

      {/* Mitra kecamatan */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-5 sm:pb-24">
        <div className="grid gap-6 rounded-[24px] bg-ink-50 p-6 sm:rounded-[28px] sm:p-10 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <Landmark className="h-7 w-7 text-secondary-700" />
            <h2 className="mt-4 text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl">
              Punya komunitas atau kantor kecamatan?
            </h2>
            <p className="mt-3 max-w-xl text-neutral-600">
              Jadi mitra MADANI. Setiap transaksi di wilayahmu menyumbang bagian untuk kecamatan, dan
              kamu bisa memantau ringkasan aktivitasnya lewat dashboard kecamatan.
            </p>
          </div>
          <div className="md:justify-self-end">
            <a
              href="mailto:info@rhgteknologiindonesia.id?subject=Mitra%20Kecamatan%20MADANI"
              className="inline-flex w-full justify-center rounded-full bg-ink-700 px-7 py-3.5 font-semibold text-white hover:bg-ink-800 md:w-auto"
            >
              Ajukan kecamatanmu
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-28 px-4 pb-14 sm:px-5 sm:pb-24">
        <h2 className="text-2xl font-extrabold leading-tight text-ink-700 sm:text-3xl md:text-4xl">Pertanyaan yang sering muncul</h2>
        <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-display text-base font-bold text-ink-700 sm:text-lg [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 pr-6 leading-relaxed text-neutral-600">{f.a}</p>
            </details>
          ))}
          <details className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-display text-base font-bold text-ink-700 sm:text-lg [&::-webkit-details-marker]:hidden">
              <span>Bagaimana cara menghapus akun?</span>
              <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-4 pr-6 leading-relaxed text-neutral-600">
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
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-5 sm:py-20 lg:grid-cols-2 lg:gap-14">
          <div>
            <Lock className="h-8 w-8 text-primary-300" />
            <h2 className="mt-4 text-2xl font-extrabold leading-[1.15] text-white sm:text-4xl md:text-5xl">
              Dibuat supaya nyaman dan jelas.
            </h2>
            <p className="mt-4 max-w-md text-white/70">
              Setiap pesanan dan pekerjaan punya status yang bisa dilihat kedua pihak.
            </p>
            <ol className="mt-8 space-y-5 sm:mt-10">
              {[
                ['Dibuat', 'Pembeli memesan, atau pemberi kerja memilih pelamar.'],
                ['Diproses', 'Penjual atau pekerja menjalankan sesuai kesepakatan lewat chat.'],
                ['Dikonfirmasi', 'Barang diterima atau pekerjaan ditandai selesai, lalu saling memberi penilaian.'],
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
            {AMAN.map((k) => (
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
            <h2 className="max-w-xl text-2xl font-extrabold leading-tight text-white sm:text-3xl md:text-4xl">
              Mulai dari kecamatanmu sendiri.
            </h2>
            <p className="mt-3 max-w-xl text-white/70">
              Aplikasi Android dan iOS sedang disiapkan. Sementara itu, MADANI sudah bisa dipakai lewat
              browser di HP maupun laptop.
            </p>
            <p className="mt-3 max-w-xl text-sm text-white/50">
              Sebagian fitur, termasuk pembayaran, masih dalam tahap uji coba bertahap.
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