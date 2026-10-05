import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { buatProduk } from '@/lib/actions/produk';
import ProdukForm from '../produk-form';

export const dynamic = 'force-dynamic';

export default async function ProdukBaruPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data: toko } = await supabase
    .from('toko')
    .select('id, status_verifikasi')
    .eq('penjual_id', user.id)
    .maybeSingle();
  if (!toko) redirect('/toko-saya');

  const { data: kategori } = await supabase
    .from('kategori')
    .select('id, nama')
    .eq('tipe', 'produk')
    .order('nama');

  return (
    <div className="mx-auto max-w-xl px-4 pb-8 pt-6">
      <Link href="/toko-saya/produk" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Produk saya
      </Link>
      <h1 className="mb-5 mt-3 font-display text-2xl font-bold">Produk baru</h1>

      {toko.status_verifikasi !== 'terverifikasi' ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Toko kamu belum terverifikasi admin, jadi belum bisa menambah produk.
        </div>
      ) : (
        <ProdukForm
          userId={user.id}
          kategori={(kategori ?? []) as { id: string; nama: string }[]}
          action={buatProduk}
          tombol="Simpan produk"
        />
      )}
    </div>
  );
}