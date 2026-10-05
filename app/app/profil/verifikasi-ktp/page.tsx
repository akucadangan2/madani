import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, ChevronLeft, Clock, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { waktuRelatif } from '@/lib/admin/data';
import KtpForm from './ktp-form';

export default async function VerifikasiKtpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('verifikasi_ktp')
    .select('status, nomor_ktp, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const ktp = data as { status: string; nomor_ktp: string | null; created_at: string } | null;
  const nikSamar = ktp?.nomor_ktp ? `•••• •••• •••• ${ktp.nomor_ktp.slice(-4)}` : '';

  return (
    <div className="mx-auto max-w-xl px-4 pb-6 pt-6">
      <Link href="/profil" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ChevronLeft className="h-4 w-4" /> Akun
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold">Verifikasi identitas</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Akun yang sudah terverifikasi bisa bertransaksi dengan aman di MADANI.
      </p>

      {ktp?.status === 'terverifikasi' && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Identitasmu sudah terverifikasi</div>
            <div className="mt-0.5 font-mono text-sm">{nikSamar}</div>
          </div>
        </div>
      )}

      {ktp?.status === 'menunggu' && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Sedang ditinjau admin</div>
            <div className="mt-0.5 text-sm">
              Diajukan {waktuRelatif(ktp.created_at)}. Biasanya selesai dalam 1×24 jam.
            </div>
          </div>
        </div>
      )}

      {ktp?.status === 'ditolak' && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Pengajuan sebelumnya ditolak</div>
            <div className="mt-0.5 text-sm">
              Pastikan NIK benar dan foto jelas, lalu kirim ulang di bawah ini.
            </div>
          </div>
        </div>
      )}

      {(!ktp || ktp.status === 'ditolak') && <KtpForm />}
    </div>
  );
}