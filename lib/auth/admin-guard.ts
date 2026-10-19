import { createClient } from '@/lib/supabase/server';

// Mengembalikan user yang sedang login jika ia admin, selain itu null.
export async function ambilAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  const admin = (roles ?? []).some((r: { role: string }) => r.role === 'admin');
  return admin ? user : null;
}