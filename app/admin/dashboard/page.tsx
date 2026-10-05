import Link from 'next/link';
import { MapPin, Receipt, ShoppingBag, Store, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { KTP, PENARIKAN, TOKO } from '@/lib/admin/konstanta';
import { hitung, rupiah, waktuRelatif } from '@/lib/admin/data';
import StatusBadge from '../_components/StatusBadge';

type TokoBaru = { id: string; nama_toko: string; created_at: string };
type Trx = { id: string; tipe: string; jumlah_total: number | string; status: string; created_at: string };

export default async function AdminDashboard() {
  const supabase = await createClient();
  const penarikanMenunggu = await hitung(supabase, 'penarikan_dana', 'status', PENARIKAN.MENUNGGU);

  const [user, tokoAktif, pesanan, kecamatan, tokoMenunggu, ktpMenunggu, { data: tokoList }, { data: trxList }] =
    await Promise.all([
      hitung(supabase, 'profiles'),
      hitung(supabase, 'toko', 'status_verifikasi', TOKO.SETUJU),
      hitung(supabase, 'pesanan'),
      hitung(supabase, 'kecamatan'),
      hitung(supabase, 'toko', 'status_verifikasi', TOKO.MENUNGGU),
      hitung(supabase, 'verifikasi_ktp', 'status', KTP.MENUNGGU),
      supabase
        .from('toko')
        .select('id, nama_toko, created_at')
        .eq('status_verifikasi', TOKO.MENUNGGU)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('transaksi')
        .select('id, tipe, jumlah_total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

  const tokoBaru = (tokoList ?? []) as TokoBaru[];
  const trx = (trxList ?? []) as Trx[];

  const stat = [
    { label: 'Pengguna', nilai: user, href: '/admin/users', icon: Users, warna: 'bg-blue-100 text-blue-700' },
    { label: 'Toko aktif', nilai: tokoAktif, href: '/admin/toko?tab=semua', icon: Store, warna: 'bg-green-100 text-green-700' },
    { label: 'Pesanan', nilai: pesanan, href: '/admin/transaksi', icon: ShoppingBag, warna: 'bg-purple-100 text-purple-700' },
    { label: 'Kecamatan', nilai: kecamatan, href: '/admin/wilayah', icon: MapPin, warna: 'bg-amber-100 text-amber-700' },
  ];

  const tindakan = [
    { n: tokoMenunggu, teks: 'toko menunggu verifikasi', href: '/admin/toko' },
    { n: ktpMenunggu, teks: 'pengajuan KTP menunggu', href: '/admin/verifikasi-ktp' },
  ].filter((x) => x.n > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Ringkasan</h1>
        <p className="mt-1 text-sm text-neutral-600">Kondisi MADANI saat ini.</p>
      </div>

      {/* Perlu tindakan */}
      {tindakan.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Semua beres. Tidak ada yang menunggu persetujuan.</span>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tindakan.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 p-4 transition hover:shadow-md"
            >
              <div>
                <div className="text-3xl font-bold text-amber-900">{t.n}</div>
                <div className="text-sm text-amber-800">{t.teks}</div>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-900">
                Tinjau <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:shadow-md"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.warna}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="mt-3 text-3xl font-bold text-neutral-900">{s.nilai}</div>
              <div className="text-sm text-neutral-600">{s.label}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Toko menunggu */}
        <section className="rounded-2xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <h2 className="font-semibold text-neutral-900">Toko menunggu verifikasi</h2>
            <Link href="/admin/toko" className="text-sm text-secondary-700 hover:underline">
              Lihat semua
            </Link>
          </div>
          {tokoBaru.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">Tidak ada.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {tokoBaru.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-neutral-800">{t.nama_toko}</span>
                  <span className="text-xs text-neutral-500">{waktuRelatif(t.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Transaksi terbaru */}
        <section className="rounded-2xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
              <Receipt className="h-4 w-4" /> Transaksi terbaru
            </h2>
            <Link href="/admin/transaksi" className="text-sm text-secondary-700 hover:underline">
              Lihat semua
            </Link>
          </div>
          {trx.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">Belum ada transaksi.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {trx.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-neutral-800">{rupiah(r.jumlah_total)}</div>
                    <div className="text-xs text-neutral-500">
                      {r.tipe} · {waktuRelatif(r.created_at)}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}