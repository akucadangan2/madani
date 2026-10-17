import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';

export const dynamic = 'force-dynamic';

// Memastikan kecamatan terpilih ada di tabel kecamatan, lalu mengembalikan id-nya.
export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json(
      { success: false, error: 'Sesi habis, silakan login ulang' },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const kode = String(body?.kode ?? '').trim();
  if (!/^\d{2}\.\d{2}\.\d{2}$/.test(kode)) {
    return NextResponse.json({ success: false, error: 'Kode wilayah tidak valid' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('app_pastikan_kecamatan', { p_kode: kode });
  if (error || !data) {
    console.error('[api/wilayah/pastikan]', error?.message);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Gagal memilih kecamatan' },
      { status: 400 },
    );
  }
  return NextResponse.json({ success: true, id: data });
}