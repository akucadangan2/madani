import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import {
  Store, Package, ClipboardList, ShoppingBag, ShoppingCart, Briefcase,
  FilePlus, History, Wallet, ShieldCheck, Landmark, ChevronRight, type LucideIcon,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type Tone = 'kerja' | 'belanja' | 'umum';
type Item = { href: string; label: string; desc: string; icon: LucideIcon };

const TONE: Record<Tone, string> = {
  kerja: 'bg-secondary-50 text-secondary-700',
  belanja: 'bg-primary-100 text-primary-700',
  umum: 'bg-ink-50 text-ink-600',
};

const ROLE_SECTIONS: Record<string, { title: string; tone: Tone; items: Item[] }> = {
  penjual: {
    title: 'Penjual',
    tone: 'belanja',
    items: [
      { href: '/toko-saya', label: 'Toko saya', desc: 'Ringkasan toko dan produk terbaru', icon: Store },
      { href: '/toko-saya/produk', label: 'Produk', desc: 'Tambah dan atur produk', icon: Package },
      { href: '/toko-saya/pesanan-masuk', label: 'Pesanan masuk', desc: 'Proses pesanan dari pembeli', icon: ClipboardList },
    ],
  },
  pembeli: {
    title: 'Pembeli',
    tone: 'belanja',
    items: [
      { href: '/marketplace', label: 'Marketplace', desc: 'Belanja dari penjual sekitar', icon: ShoppingBag },
      { href: '/marketplace/keranjang', label: 'Keranjang', desc: 'Lihat isi keranjang', icon: ShoppingCart },
      { href: '/marketplace/pesanan', label: 'Pesanan saya', desc: 'Pantau status pesanan', icon: ClipboardList },
    ],
  },
  pencari_kerja: {
    title: 'Pencari kerja',
    tone: 'kerja',
    items: [
      { href: '/kerja', label: 'Cari lowongan', desc: 'Lamar kerja di kecamatanmu', icon: Briefcase },
      { href: '/kerja/riwayat', label: 'Riwayat kerja', desc: 'Lamaran dan pekerjaanmu', icon: History },
    ],
  },
  pemberi_kerja: {
    title: 'Pemberi kerja',
    tone: 'kerja',
    items: [
      { href: '/kerja/posting', label: 'Posting lowongan', desc: 'Buat lowongan baru', icon: FilePlus },
      { href: '/kerja/riwayat', label: 'Riwayat kerja', desc: 'Pantau pekerjaan yang kamu posting', icon: History },
    ],
  },
};

export default async function BerandaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', user.id),
    supabase.from('profiles').select('active_role').eq('id', user.id).maybeSingle(),
  ]);

  const roles: string[] = (roleRows ?? []).map((r: any) => r.role);
  if (roles.length === 0) redirect('/pilih-peran');

  // Peran aktif tampil paling atas.
  const activeRole: string | undefined = profile?.active_role;
  const sections = roles
    .filter((r) => ROLE_SECTIONS[r])
    .sort((a, b) => (a === activeRole ? -1 : b === activeRole ? 1 : 0));

  const umum: Item[] = [
    { href: '/saldo', label: 'Saldo', desc: 'Saldo dan penarikan dana', icon: Wallet },
  ];
  if (roles.includes('admin')) {
    umum.push({ href: '/admin/dashboard', label: 'Panel admin', desc: 'Kelola platform', icon: ShieldCheck });
  }
  if (roles.includes('kecamatan')) {
    umum.push({ href: '/kecamatan/dashboard', label: 'Dashboard kecamatan', desc: 'Pantau transaksi wilayah', icon: Landmark });
  }

  const blocks: { key: string; title: string; tone: Tone; items: Item[] }[] = [
    ...sections.map((r) => ({ key: r, ...ROLE_SECTIONS[r] })),
    { key: 'umum', title: 'Lainnya', tone: 'umum' as Tone, items: umum },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="rounded-b-[32px] bg-ink-700 px-5 pb-10 pt-12 text-white">
        <div className="mx-auto max-w-2xl">
          <p className="text-white/70">Halo,</p>
          <h1 className="mt-1 text-4xl font-extrabold leading-tight text-white">
            {user.full_name || 'warga MADANI'}
          </h1>
          {activeRole && ROLE_SECTIONS[activeRole] && (
            <p className="mt-4 inline-flex rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium">
              Peran aktif: {ROLE_SECTIONS[activeRole].title}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-5 py-8">
        {blocks.map((block) => (
          <section key={block.key}>
            <h2 className="mb-3 text-lg font-bold text-ink-700">{block.title}</h2>
            <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {block.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href + item.label}>
                    <Link href={item.href} className="flex items-center gap-4 p-4 hover:bg-neutral-50">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONE[block.tone]}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink-700">{item.label}</span>
                        <span className="block text-sm text-neutral-500">{item.desc}</span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}