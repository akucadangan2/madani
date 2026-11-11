import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function sel(v: unknown) {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Belum login', { status: 401 });

  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (!(roles ?? []).some((r: { role: string }) => r.role === 'admin')) {
    return new NextResponse('Tidak berwenang', { status: 403 });
  }

  const status = new URL(req.url).searchParams.get('status') === 'selesai' ? 'selesai' : 'disetujui';
  const { data, error } = await supabase
    .from('penarikan_dana')
    .select('id, user_id, jumlah, bank_nama, bank_rekening, bank_atas_nama, diproses_at, selesai_at, bukti_ref')
    .eq('status', status)
    .order('diproses_at', { ascending: true })
    .limit(1000);
  if (error) return new NextResponse(error.message, { status: 500 });

  const rows = (data ?? []) as {
    id: string;
    user_id: string;
    jumlah: number | string;
    bank_nama: string | null;
    bank_rekening: string | null;
    bank_atas_nama: string | null;
    diproses_at: string | null;
    selesai_at: string | null;
    bukti_ref: string | null;
  }[];

  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profs } = ids.length
    ? await supabase.from('profiles').select('id, full_name').in('id', ids)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nama = new Map(
    ((profs ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name ?? '-'])
  );

  const wib = (v: string | null) =>
    v ? new Date(v).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '';

  const baris = [
    ['No', 'Nama pengguna', 'Bank', 'No. rekening', 'Atas nama', 'Jumlah (Rp)', 'Disetujui', 'Selesai', 'Referensi', 'ID'].join(','),
    ...rows.map((r, i) =>
      [
        i + 1,
        nama.get(r.user_id) ?? '-',
        r.bank_nama ?? '',
        r.bank_rekening ?? '',
        r.bank_atas_nama ?? '',
        Math.round(Number(r.jumlah)),
        wib(r.diproses_at),
        wib(r.selesai_at),
        r.bukti_ref ?? '',
        r.id,
      ]
        .map(sel)
        .join(',')
    ),
  ];

  const tanggal = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  return new NextResponse('\uFEFF' + baris.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pencairan-${status}-${tanggal}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}