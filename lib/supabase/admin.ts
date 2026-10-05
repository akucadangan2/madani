import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// HANYA dipakai di server (route handler) — bypass RLS. Jangan pernah
// import ini di client component, nanti service role key kebawa ke bundle.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}