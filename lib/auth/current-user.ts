import { createClient } from '@/lib/supabase/server';

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Session valid tapi profil belum ada / tidak terbaca: tetap dianggap login.
  return {
    id: user.id,
    full_name: (profile as { full_name?: string } | null)?.full_name ?? '',
  };
}