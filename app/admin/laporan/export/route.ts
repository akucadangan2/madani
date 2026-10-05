import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ambilTransaksi, bulanValid } from '@/lib/admin/laporan';

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  const admin = ((roles ?? []) as { role: string }[]).some((r) => r.role === 'admin');
  if (!admin) return new NextResponse('Forbidden', { status: 403 });

  const bulan = bulanValid(new URL(req.url).searchParams.get('bulan'));
  const [{ rows, error }, { data: kecs }] = await Promise.all([
    ambilTransaksi(supabase, bulan),
    supabase.from('kecamatan').select('id, nama'),
  ]);
  if (error) return new NextResponse(error, { status: 500 });

  const namaKec = new Map(((kecs ?? []) as { id: string; nama: string }[]).map((k) => [k.id, k.nama]));
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

  const baris: (string | number)[][] = [
    ['waktu', 'tipe', 'status', 'kecamatan', 'jumlah_total'],
    ...rows.map((r) => [
      new Date(r.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      r.tipe,
      r.status,
      r.kecamatan_id ? namaKec.get(r.kecamatan_id) ?? '-' : '-',
      Number(r.jumlah_total || 0),
    ]),
  ];

  const csv = '\uFEFF' + baris.map((b) => b.map(esc).join(',')).join('\r\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="laporan-transaksi-${bulan}.csv"`,
    },
  });
}