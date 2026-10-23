import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, Store } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/current-user';
import BuatTokoForm from '../buat-toko-form';

export const dynamic = 'force-dynamic';

export default async function TokoBaruPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="mx-auto max-w-md px-4 pb-8 pt-6">
      <Link href="/toko-saya" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Toko saya
      </Link>
      <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-50">
          <Store className="h-7 w-7 text-secondary-600" />
        </div>
        <h1 className="text-center font-display text-xl font-bold text-neutral-900">Tambah Toko</h1>
        <p className="mt-1.5 text-center text-sm text-neutral-500">
          Toko baru diperiksa admin dulu sebelum bisa menambah produk. Tokomu yang lain tetap berjalan.
        </p>
        <BuatTokoForm />
      </div>
    </div>
  );
}