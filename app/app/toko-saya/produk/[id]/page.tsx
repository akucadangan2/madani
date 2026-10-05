import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { ubahProduk } from '@/lib/actions/produk';
import ProdukForm from '../produk-form';

export const dynamic = 'force-dynamic';

export default async function EditProdukPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data: toko } = await supabase.from('toko').select('id').eq('penjual_id', user.id).maybeSingle();
  if (!toko) redirect('/toko-saya');

  const { data: p } = await supabase
    .from('produk')
    .select('id, nama, deskripsi, kategori_id, harga, stok, status, foto_url')
    .eq('id', id)
    .eq('toko_id', toko.id)
    .maybeSingle();
  if (!p) notFound();

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
      <h1 className="mb-5 mt-3 font-display text-2xl font-bold">Edit produk</h1>

      <ProdukForm
        userId={user.id}
        kategori={(kategori ?? []) as { id: string; nama: string }[]}
        action={ubahProduk.bind(null, p.id)}
        tombol="Simpan perubahan"
        awal={{
          nama: p.nama ?? '',
          deskripsi: p.deskripsi ?? '',
          kategori_id: p.kategori_id ?? '',
          harga: Number(p.harga),
          stok: Number(p.stok ?? 0),
          status: p.status ?? 'aktif',
          foto: (p.foto_url ?? []) as string[],
        }}
      />
    </div>
  );
}