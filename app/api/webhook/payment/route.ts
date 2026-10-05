import { NextResponse, type NextRequest } from 'next/server';

// TODO: handle callback dari Midtrans/Xendit di sini.
// Verifikasi signature, update status transaksi, trigger pencatatan bagi hasil.
export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log('payment webhook:', body);

  return NextResponse.json({ received: true });
}
