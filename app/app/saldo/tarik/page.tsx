import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ambilSaldo } from '@/lib/saldo';
import { rupiah } from '@/lib/admin/data';
import FormTarik from './form-tarik';

// Daftar bank diambil dari tabel bank_ref (kode bank sesuai DOKU)

function gagal(pesan: string): never {
  redirect('/saldo/tarik?error=' + encodeURIComponent(pesan));
}

async function ajukan(formData: FormData): Promise<void> {
  'use server';
  const jumlah = Number(String(formData.get('jumlah') ?? '').replace(/\D/g, ''));
  const bank = String(formData.get('bank_nama') ?? '').trim().slice(0, 50);
  const bankKode = String(formData.get('bank_kode') ?? '').trim().slice(0, 10);
  const rekening = String(formData.get('bank_rekening') ?? '').replace(/\s/g, '').slice(0, 30);
  const atasNama = String(formData.get('bank_atas_nama') ?? '').trim().slice(0, 100);

  if (!bank || !bankKode) gagal('Pilih bank dari daftar');
  if (!/^\d{5,30}$/.test(rekening)) gagal('Nomor rekening harus berupa angka');
  if (!atasNama) gagal('Nama pemilik rekening wajib diisi');
  if (!Number.isFinite(jumlah) || jumlah <= 0) gagal('Isi jumlah penarikan');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { saldo, diproses } = await ambilSaldo(supabase, user.id);
  if (diproses > 0) gagal('Masih ada pengajuan penarikan yang menunggu diproses');
  if (jumlah > saldo) gagal(`Saldo tidak cukup. Saldo kamu ${rupiah(saldo)}`);

  // Batas minimal/maksimal, biaya, dan jadwal dihitung dan dikunci oleh database saat insert.
  const { error } = await supabase.from('penarikan_dana').insert({
    user_id: user.id,
    jumlah,
    status: 'menunggu',
    bank_nama: bank,
    bank_kode: bankKode,
    bank_rekening: rekening,
    bank_atas_nama: atasNama,
  });
  if (error) gagal(error.message);

  let info = '';
  try {
    const { data } = await supabase
      .from('penarikan_dana')
      .select('jadwal_cair, jumlah_bersih')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const d = data as { jadwal_cair?: string | null; jumlah_bersih?: number | string | null } | null;
    if (d?.jadwal_cair) {
      const tgl = new Date(d.jadwal_cair + 'T12:00:00+07:00').toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'Asia/Jakarta',
      });
      info = `. Dana ${rupiah(Number(d.jumlah_bersih ?? jumlah))} diperkirakan masuk ${tgl}`;
    }
  } catch {
    info = '';
  }

  revalidatePath('/', 'layout');
  redirect('/saldo?ok=' + encodeURIComponent('Pengajuan terkirim. Admin akan memproses dan transfer ke rekeningmu' + info));
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

  const [{ saldo, diproses }, { data: profil }, { data: bankRef }] = await Promise.all([
    ambilSaldo(supabase, user.id),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('bank_ref').select('kode, nama, nama_tampil, alias, populer').eq('aktif', true).order('urutan').order('nama'),
  ]);
  const namaDefault = (profil as { full_name?: string | null } | null)?.full_name ?? '';

  return (
    <div className="mx-auto max-w-xl px-4 pt-6">
      <Link href="/saldo" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Kembali
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold">Tarik dana</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Saldo kamu <span className="font-semibold text-neutral-900">{rupiah(saldo)}</span>. Dana ditransfer oleh
        admin ke rekening di bawah pada hari kerja.
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
        <FormTarik saldo={saldo} namaDefault={namaDefault} bank={bankRef ?? []} aksi={ajukan} />
      )}
    </div>
  );
}