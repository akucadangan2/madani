import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

function tandatangan(o: {
  clientId: string;
  requestId: string;
  timestamp: string;
  target: string;
  body: string;
  secret: string;
}): string {
  const digest = createHash('sha256').update(o.body, 'utf8').digest('base64');
  const komponen = [
    `Client-Id:${o.clientId}`,
    `Request-Id:${o.requestId}`,
    `Request-Timestamp:${o.timestamp}`,
    `Request-Target:${o.target}`,
    `Digest:${digest}`,
  ].join('\n');
  return 'HMACSHA256=' + createHmac('sha256', o.secret).update(komponen, 'utf8').digest('base64');
}

type RespCheckout = { response?: { payment?: { url?: string; expired_date?: string } } };

export async function buatCheckout(p: {
  invoice: string;
  jumlah: number;
  callbackUrl: string;
  menit?: number;
  pelanggan?: { nama?: string; email?: string; telepon?: string };
}): Promise<{ url: string; expired?: string }> {
  const clientId = process.env.DOKU_CLIENT_ID;
  const secret = process.env.DOKU_SECRET_KEY;
  if (!clientId || !secret) throw new Error('DOKU belum dikonfigurasi');

  const base = (process.env.DOKU_BASE_URL ?? 'https://api-sandbox.doku.com').replace(/\/$/, '');
  const target = '/checkout/v1/payment';
  const pl = p.pelanggan ?? {};
  const customer: Record<string, string> = {};
  if (pl.nama) customer.name = pl.nama.slice(0, 100);
  if (pl.email) customer.email = pl.email;
  if (pl.telepon) customer.phone = pl.telepon;
  const body = JSON.stringify({
    order: {
      amount: Math.round(p.jumlah),
      invoice_number: p.invoice,
      callback_url: p.callbackUrl,
    },
    payment: { payment_due_date: p.menit ?? 60 },
    ...(Object.keys(customer).length ? { customer } : {}),
  });

  const requestId = randomUUID();
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  const res = await fetch(base + target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': clientId,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      Signature: tandatangan({ clientId, requestId, timestamp, target, body, secret }),
    },
    body,
    cache: 'no-store',
  });

  const teks = await res.text();
  let j: RespCheckout = {};
  try {
    j = JSON.parse(teks) as RespCheckout;
  } catch {
    /* biarkan kosong */
  }
  const url = j.response?.payment?.url;
  if (!res.ok || typeof url !== 'string') {
    console.error('[doku] gagal membuat checkout', res.status, teks.slice(0, 500));
    throw new Error(`Gagal membuat halaman pembayaran (DOKU ${res.status}): ${teks.slice(0, 300)}`);
  }
  return { url, expired: j.response?.payment?.expired_date };
}

/** Verifikasi tanda tangan notifikasi dari DOKU. `target` = path URL notifikasi kita. */
export function verifikasiNotifikasi(o: { headers: Headers; target: string; body: string }): boolean {
  const clientId = process.env.DOKU_CLIENT_ID;
  const secret = process.env.DOKU_SECRET_KEY;
  if (!clientId || !secret) return false;

  const cid = o.headers.get('client-id');
  const requestId = o.headers.get('request-id');
  const timestamp = o.headers.get('request-timestamp');
  const sig = o.headers.get('signature');
  if (!cid || !requestId || !timestamp || !sig || cid !== clientId) return false;

  const hitung = tandatangan({ clientId, requestId, timestamp, target: o.target, body: o.body, secret });
  const a = Buffer.from(hitung);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
/** Tanda tangan untuk request GET (tanpa Digest), mis. Check Status. */
function tandatanganGet(o: { clientId: string; requestId: string; timestamp: string; target: string; secret: string }): string {
  const komponen = [
    `Client-Id:${o.clientId}`,
    `Request-Id:${o.requestId}`,
    `Request-Timestamp:${o.timestamp}`,
    `Request-Target:${o.target}`,
  ].join('\n');
  return 'HMACSHA256=' + createHmac('sha256', o.secret).update(komponen, 'utf8').digest('base64');
}

type RespStatus = { order?: { amount?: number | string }; transaction?: { status?: string } };

/** Tanya status pembayaran ke DOKU (Check Status API). Mengembalikan null bila tidak bisa dicek. */
export async function cekStatusDoku(invoice: string): Promise<{ status: string; jumlah: number | null } | null> {
  const clientId = process.env.DOKU_CLIENT_ID;
  const secret = process.env.DOKU_SECRET_KEY;
  if (!clientId || !secret || !/^[A-Za-z0-9._-]{4,64}$/.test(invoice)) return null;

  const base = (process.env.DOKU_BASE_URL ?? 'https://api-sandbox.doku.com').replace(/\/$/, '');
  const target = '/orders/v1/status/' + invoice;
  const requestId = randomUUID();
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  try {
    const res = await fetch(base + target, {
      method: 'GET',
      headers: {
        'Client-Id': clientId,
        'Request-Id': requestId,
        'Request-Timestamp': timestamp,
        Signature: tandatanganGet({ clientId, requestId, timestamp, target, secret }),
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const j = (await res.json()) as RespStatus;
    const status = String(j.transaction?.status ?? '').toUpperCase();
    if (!status) return null;
    const n = Number(j.order?.amount);
    return { status, jumlah: Number.isFinite(n) ? n : null };
  } catch (e) {
    console.error('[doku] cek status gagal', invoice, e instanceof Error ? e.message : String(e));
    return null;
  }
}