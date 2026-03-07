import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Verifies the current user is an admin.
 * Redirects to /dashboard if not authenticated or not admin.
 * Returns { supabase, userId } on success.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/dashboard');

  return { supabase, userId: user.id };
}

/**
 * Checks admin status for API routes. Returns null if not admin.
 */
export async function checkAdminApi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) return null;

  return { supabase, userId: user.id };
}
