import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

// Fallback: cari user di auth.users berdasarkan nomor HP (tanpa "+").
async function findUserIdByPhone(supabase: AdminClient, normalizedPhone: string) {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) return null;
    const found = data.users.find((u) => (u.phone ?? '').replace(/^\+/, '') === normalizedPhone);
    if (found) return found.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code, fullName } = await request.json();
    if (!phone || !code) {
      return NextResponse.json({ error: 'Nomor HP & kode wajib diisi' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: otpRow } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return NextResponse.json({ error: 'Kode OTP salah atau sudah kedaluwarsa' }, { status: 400 });
    }

    // Supabase nyimpen auth.users.phone tanpa tanda "+", jadi samain formatnya.
    const normalizedPhone = String(phone).replace(/^\+/, '');

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    let userId: string | null | undefined = existingProfile?.id;

    if (!userId) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        phone,
        phone_confirm: true,
        user_metadata: { full_name: fullName || '' },
      });

      if (createError) {
        // User sudah ada di auth.users tapi belum punya baris profiles.
        userId = await findUserIdByPhone(supabase, normalizedPhone);
        if (!userId) {
          return NextResponse.json({ error: createError.message }, { status: 500 });
        }
      } else {
        userId = created.user.id;
      }
    }

    // Password acak sekali pakai — nggak pernah disimpan/ditampilkan, cuma buat dapet session.
    const tempPassword = crypto.randomUUID();
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Sign-in pakai client anon TERPISAH, supaya client admin tidak berubah jadi sesi user
    // (kalau berubah, delete otp_codes di bawah ditolak RLS dan OTP bisa dipakai ulang).
    const anon = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
      phone,
      password: tempPassword,
    });
    if (signInError || !signInData.session) {
      return NextResponse.json(
        { error: signInError?.message ?? 'Gagal membuat sesi login' },
        { status: 500 }
      );
    }

    // OTP baru dihapus setelah sesi berhasil dibuat.
    await supabase.from('otp_codes').delete().eq('id', otpRow.id);

    return NextResponse.json({
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    });
  } catch (e) {
    console.error('[verify-otp] exception:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Terjadi kesalahan di server' },
      { status: 500 }
    );
  }
}