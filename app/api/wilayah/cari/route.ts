import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Cari kecamatan di seluruh Indonesia (nama kecamatan, kota/kabupaten, provinsi).
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 80);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('app_cari_wilayah', {
    p_q: q === '' ? null : q,
    p_limit: 40,
    p_hanya_aktif: false,
  });
  if (error) {
    console.error('[api/wilayah/cari]', error.message);
    return NextResponse.json({ data: [], error: 'Gagal mencari wilayah' }, { status: 500 });
  }
  return NextResponse.json({ data: data ?? [] });
}