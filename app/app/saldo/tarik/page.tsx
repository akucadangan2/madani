import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { MIN_TARIK, ambilSaldo } from '@/lib/saldo';
import { rupiah } from '@/lib/admin/data';

const BANK = ['BCA', 'BRI', 'BNI', 'Mandiri', 'BSI', 'CIMB Niaga', 'Permata', 'DANA', 'OVO', 'GoPay', 'ShopeePay'];

function gagal(pesan: string): never {
  redirect('/saldo/tarik?error=' + encodeURIComponent(pesan));
}

async function ajukan(formData: FormData): Promise<void> {
  'use server';
  const jumlah = Number(String(formData.get('jumlah') ?? '').replace(/\D/g, ''));
  const bank = String(formData.get('bank_nama') ?? '').trim().slice(0, 50);
  const rekening = String(formData.get('bank_rekening') ?? '').replace(/\s/g, '').slice(0, 30);
  const atasNama = String(formData.get('bank_atas_nama') ?? '').trim().slice(0, 100);

  if (!bank) gagal('Nama bank wajib diisi');
  if (!/^\d{5,30}$/.test(rekening)) gagal('Nomor rekening harus berupa angka');
  if (!atasNama) gagal('Nama pemilik rekening wajib diisi');
  if (!Number.isFinite(jumlah) || jumlah < MIN_TARIK) gagal(`Minimal penarikan ${rupiah(MIN_TARIK)}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { saldo, diproses } = await ambilSaldo(supabase, user.id);
  if (diproses > 0) gagal('Masih ada pengajuan penarikan yang menunggu diproses');
  if (jumlah > saldo) gagal(`Saldo tidak cukup. Saldo kamu ${rupiah(saldo)}`);

  const { error } = await supabase.from('penarikan_dana').insert({
    user_id: user.id,
    jumlah,
    status: 'menunggu',
    bank_nama: bank,
    bank_rekening: rekening,
    bank_atas_nama: atasNama,
  });
  if (error) gagal(error.message);

  revalidatePath('/', 'layout');
  redirect('/saldo?ok=' + encodeURIComponent('Pengajuan terkirim. Admin akan memproses dan transfer ke rekeningmu'));
}

export default async function TarikPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errMsg } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ saldo, diproses }, { data: profil }] = await Promise.all([
    ambilSaldo(supabase, user.id),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ]);
  const namaDefault = (profil as { full_name?: string | null } | null)?.full_name ?? '';

  const input =
    'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-neutral-400';

  return (
    <div className="mx-auto max-w-xl px-4 pt-6">
      <Link href="/saldo" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Kembali
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold">Tarik dana</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Saldo kamu <span className="font-semibold text-neutral-900">{rupiah(saldo)}</span>. Dana ditransfer manual
        oleh admin ke rekening di bawah.
      </p>

      {errMsg && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {errMsg}
        </div>
      )}

      {diproses > 0 ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Kamu masih punya pengajuan sebesar {rupiah(diproses)} yang menunggu diproses admin. Tunggu sampai selesai
          sebelum mengajukan lagi.
        </div>
      ) : (
        <form action={ajukan} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">Jumlah (Rp)</label>
            <input
              name="jumlah"
              inputMode="numeric"
              required
              placeholder={`Minimal ${MIN_TARIK.toLocaleString('id-ID')}`}
              className={input}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">Bank / e-wallet</label>
            <input name="bank_nama" list="daftar-bank" required placeholder="Contoh: BRI" className={input} />
            <datalist id="daftar-bank">
              {BANK.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">Nomor rekening</label>
            <input name="bank_rekening" inputMode="numeric" required placeholder="Hanya angka" className={input} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">Atas nama</label>
            <input name="bank_atas_nama" required defaultValue={namaDefault} className={input} />
          </div>

          <button className="w-full rounded-2xl bg-ink-900 py-3.5 text-sm font-semibold text-white hover:opacity-90">
            Ajukan penarikan
          </button>
        </form>
      )}
    </div>
  );
}