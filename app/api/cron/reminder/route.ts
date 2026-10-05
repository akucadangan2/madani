import { NextResponse } from 'next/server';

// TODO: cron job (reminder OTP expired, pencairan pending, dll).
// Jadwalkan via Vercel Cron atau scheduler lain.
export async function GET() {
  return NextResponse.json({ ok: true });
}
