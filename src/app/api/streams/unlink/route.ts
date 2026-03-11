import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { STREAM_PLATFORMS } from '@/lib/constants';

const unlinkSchema = z.object({
  platform: z.enum(STREAM_PLATFORMS),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = unlinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  const { platform } = parsed.data;

  const { error } = await supabase
    .from('user_stream_channels')
    .delete()
    .eq('user_id', user.id)
    .eq('platform', platform);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
