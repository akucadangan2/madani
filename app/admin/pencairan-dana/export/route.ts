import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function sel(v: unknown) {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

type Baris = {
  id: string;
  user_id: string;
  jumlah: number | string;
  jumlah_bersih: number | string | null;
  biaya_total: number | string | null;
  jadwal_cair: string | null;
  bank_nama: string | null;
  bank_kode: string | null;
  bank_rekening: string | null;
  bank_atas_nama: string | null;
  diproses_at: string | null;
  selesai_at: string | null;
  bukti_ref: string | null;
};

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

  const url = new URL(req.url);
  const batch = (url.searchParams.get('batch') ?? '').trim();
  const status = url.searchParams.get('status') === 'selesai' ? 'selesai' : 'disetujui';

  let kodePaket = '';
  let q = supabase
    .from('penarikan_dana')
    .select(
      'id, user_id, jumlah, jumlah_bersih, biaya_total, jadwal_cair, bank_nama, bank_kode, bank_rekening, bank_atas_nama, diproses_at, selesai_at, bukti_ref'
    );

  if (batch) {
    if (!/^[0-9a-f-]{36}$/i.test(batch)) return new NextResponse('Paket tidak valid', { status: 400 });
    const { data: b } = await supabase.from('penarikan_batch').select('kode').eq('id', batch).maybeSingle();
    kodePaket = (b as { kode?: string } | null)?.kode ?? '';
    if (!kodePaket) return new NextResponse('Paket tidak ditemukan', { status: 404 });
    q = q.eq('batch_id', batch);
  } else {
    q = q.eq('status', status);
  }

  const { data, error } = await q.order('jadwal_cair', { ascending: true, nullsFirst: false }).order('diproses_at', { ascending: true }).limit(1000);
  if (error) return new NextResponse(error.message, { status: 500 });

  const rows = (data ?? []) as Baris[];

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
    [
      'No',
      'Nama pengguna',
      'Bank',
      'Kode bank',
      'No. rekening',
      'Atas nama',
      'Jumlah transfer (Rp)',
      'Jumlah diajukan (Rp)',
      'Potongan (Rp)',
      'Jadwal cair',
      'Disetujui',
      'Selesai',
      'Referensi',
      'ID',
    ].join(','),
    ...rows.map((r, i) =>
      [
        i + 1,
        nama.get(r.user_id) ?? '-',
        r.bank_nama ?? '',
        r.bank_kode ?? '',
        r.bank_rekening ?? '',
        r.bank_atas_nama ?? '',
        Math.round(Number(r.jumlah_bersih ?? r.jumlah)),
        Math.round(Number(r.jumlah)),
        Math.round(Number(r.biaya_total ?? 0)),
        r.jadwal_cair ?? '',
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
  const nm = batch ? `paket-${kodePaket}` : `pencairan-${status}-${tanggal}`;
  return new NextResponse('\uFEFF' + baris.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nm}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}