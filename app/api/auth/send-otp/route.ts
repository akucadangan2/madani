import { randomInt } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppOtp } from '@/lib/fonnte';

const BATAS_PER_NOMOR = 3; // maks kode per nomor per 10 menit
const JEDA_DETIK = 60; // jarak minimal antar permintaan per nomor
const BATAS_PER_IP = 10; // maks kode per IP per jam
const BATAS_HARIAN = Number(process.env.OTP_MAKS_HARIAN ?? 500); // pagar total per 24 jam

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('62') ? `+${digits}` : `+62${digits.replace(/^0/, '')}`;
}

function ambilIp(request: NextRequest) {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function tolak(pesan: string, status: number, retryDetik?: number) {
  return NextResponse.json(
    { error: pesan },
    { status, headers: retryDetik ? { 'Retry-After': String(retryDetik) } : undefined }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === 'string' ? body.phone : '';
  if (!phone) return tolak('Nomor HP wajib diisi', 400);

  const normalizedPhone = normalizePhone(phone);
  if (!/^\+628\d{8,11}$/.test(normalizedPhone)) {
    return tolak('Nomor HP tidak valid. Gunakan nomor Indonesia, contoh 0812xxxxxxxx', 400);
  }

  const supabase = createAdminClient();
  const ip = ambilIp(request);

  // Akun demo untuk reviewer Apple/Google: kode tetap, tanpa kirim WhatsApp.
  const demoPhone = process.env.DEMO_PHONE ? normalizePhone(process.env.DEMO_PHONE) : null;
  const demoOtp = process.env.DEMO_OTP ?? '';
  const isDemo = !!demoPhone && !!demoOtp && normalizedPhone === demoPhone;

  if (!isDemo) {
    const sekarang = Date.now();
    const sepuluhMenit = new Date(sekarang - 10 * 60 * 1000).toISOString();
    const satuJam = new Date(sekarang - 60 * 60 * 1000).toISOString();
    const sehari = new Date(sekarang - 24 * 60 * 60 * 1000).toISOString();

    const { data: terbaru, error: errNomor } = await supabase
      .from('otp_codes')
      .select('created_at')
      .eq('phone', normalizedPhone)
      .gte('created_at', sepuluhMenit)
      .order('created_at', { ascending: false });
    if (errNomor) return tolak('Terjadi kesalahan di server', 500);

    if ((terbaru?.length ?? 0) >= BATAS_PER_NOMOR) {
      return tolak('Terlalu banyak permintaan kode. Coba lagi dalam 10 menit.', 429, 600);
    }
    const terakhir = terbaru?.[0]?.created_at;
    if (terakhir) {
      const lewat = (sekarang - new Date(terakhir).getTime()) / 1000;
      if (lewat < JEDA_DETIK) {
        const sisa = Math.ceil(JEDA_DETIK - lewat);
        return tolak(`Tunggu ${sisa} detik sebelum meminta kode lagi.`, 429, sisa);
      }
    }

    const { count: jumlahIp } = await supabase
      .from('otp_codes')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', satuJam);
    if ((jumlahIp ?? 0) >= BATAS_PER_IP) {
      return tolak('Terlalu banyak permintaan dari perangkat ini. Coba lagi nanti.', 429, 3600);
    }

    const { count: jumlahHarian } = await supabase
      .from('otp_codes')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sehari);
    if ((jumlahHarian ?? 0) >= BATAS_HARIAN) {
      return tolak('Layanan OTP sedang padat. Coba lagi beberapa jam lagi.', 503, 3600);
    }
  }

  const code = isDemo ? demoOtp : randomInt(100000, 1000000).toString();

  const { data: baris, error } = await supabase
    .from('otp_codes')
    .insert({
      phone: normalizedPhone,
      code,
      ip,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single();
  if (error || !baris) return tolak('Terjadi kesalahan di server', 500);

  if (!isDemo) {
    try {
      await sendWhatsAppOtp(normalizedPhone, code);
    } catch (e) {
      console.error('[send-otp] gagal kirim WhatsApp:', e);
      // Jangan hitung permintaan yang gagal terkirim.
      await supabase.from('otp_codes').delete().eq('id', baris.id);
      return tolak('Gagal mengirim kode OTP. Coba lagi sebentar lagi.', 502);
    }
  }

  return NextResponse.json({ success: true, phone: normalizedPhone });
}