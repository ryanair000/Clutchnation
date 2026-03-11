import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSms } from '@/lib/africastalking';
import { APP_NAME } from '@/lib/constants';

const PHONE_REGEX = /^\+\d{10,15}$/;
const RATE_LIMIT_PER_DAY = 10;

// Simple in-memory rate-limit (per-user, per-day). Resets on redeploy.
const inviteCounts = new Map<string, { count: number; date: string }>();

function checkRateLimit(userId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const entry = inviteCounts.get(userId);
  if (!entry || entry.date !== today) {
    inviteCounts.set(userId, { count: 1, date: today });
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_DAY) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const senderName = profile?.username ?? 'A friend';

  let body: { phone: string; channel: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { phone, channel } = body;

  if (!phone || !PHONE_REGEX.test(phone)) {
    return NextResponse.json(
      { error: 'Phone must be in international format (e.g. +254712345678)' },
      { status: 400 },
    );
  }

  if (!channel || !['sms', 'whatsapp'].includes(channel)) {
    return NextResponse.json({ error: 'Channel must be "sms" or "whatsapp"' }, { status: 400 });
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: `You can send up to ${RATE_LIMIT_PER_DAY} invites per day` },
      { status: 429 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clutchnation.gg';
  const signupLink = `${appUrl}/signup`;
  const message = `${senderName} invited you to join ${APP_NAME} — the competitive FC26 PlayStation platform in Kenya! Sign up: ${signupLink}`;

  if (channel === 'whatsapp') {
    // Generate a WhatsApp deep-link for the client to open
    const waText = encodeURIComponent(message);
    const cleanPhone = phone.replace('+', '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;
    return NextResponse.json({ success: true, channel: 'whatsapp', waUrl });
  }

  // SMS via Africa's Talking
  const result = await sendSms(phone, message);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? 'Failed to send SMS' },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, channel: 'sms', messageId: result.messageId });
}
