import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isSafeRedirect } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawRedirect = searchParams.get('redirect') ?? '/dashboard';
  const redirect = isSafeRedirect(rawRedirect) ? rawRedirect : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
