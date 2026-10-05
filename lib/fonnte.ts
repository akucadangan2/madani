// Cek lagi format request di docs Fonnte kamu (device token / endpoint bisa beda
// tergantung paket) — ini bentuk standarnya.
export async function sendWhatsAppOtp(phone: string, code: string) {
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      Authorization: process.env.FONNTE_TOKEN!,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      target: phone,
      message: `Kode OTP MADANI kamu: ${code}\n\nJangan berikan kode ini ke siapa pun. Berlaku 5 menit.`,
    }),
  });

  const data = await res.json();
  if (!data.status) throw new Error(data.reason || 'Gagal mengirim OTP via Fonnte');
  return data;
}