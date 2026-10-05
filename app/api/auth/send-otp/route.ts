import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppOtp } from '@/lib/fonnte';

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('62') ? `+${digits}` : `+62${digits.replace(/^0/, '')}`;
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  const { phone } = await request.json();
  if (!phone) return NextResponse.json({ error: 'Nomor HP wajib diisi' }, { status: 400 });

  const normalizedPhone = normalizePhone(phone);
  const code = generateCode();
  const supabase = createAdminClient();

  const { error } = await supabase.from('otp_codes').insert({
    phone: normalizedPhone,
    code,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await sendWhatsAppOtp(normalizedPhone, code);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, phone: normalizedPhone });
}