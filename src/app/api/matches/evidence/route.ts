import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData();
  const file = form.get('file') as File | null;
  const matchId = form.get('matchId') as string;
  if (!file || !matchId) return NextResponse.json({ error: 'Missing file or matchId' }, { status: 400 });

  const ext = file.name.split('.').pop();
  const filename = `evidence/${matchId}/${randomUUID()}.${ext}`;

  // Upload to Supabase Storage (bucket: evidence)
  const { data, error } = await supabase.storage
    .from('evidence')
    .upload(filename, file, { contentType: file.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: publicUrl } = supabase.storage.from('evidence').getPublicUrl(filename);

  // Insert record
  await supabase.from('match_evidence').insert({
    match_id: matchId,
    uploaded_by: user.id,
    image_path: filename,
    image_url: publicUrl.publicUrl,
  });

  return NextResponse.json({ success: true });
}
