// TODO: implementasi client Midtrans (Snap API) di sini.
// Dokumentasi: https://docs.midtrans.com/

export async function createSnapTransaction(params: {
  orderId: string;
  grossAmount: number;
  customerName: string;
}) {
  throw new Error('Belum diimplementasikan — isi server key di .env.local dulu');
}
