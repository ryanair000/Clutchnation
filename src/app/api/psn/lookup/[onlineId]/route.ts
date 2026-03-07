import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * PSN Lookup API Route
 * GET /api/psn/lookup/[onlineId]
 *
 * This is a placeholder for the PSN live data lookup service.
 * In production, this would use psn-api to fetch real PSN data.
 * Currently feature-flagged off by default.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ onlineId: string }> }
) {
  // Auth check — must be logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Feature flag check
  const serviceClient = createServiceClient();
  const { data: flag } = await serviceClient
    .from('feature_flags')
    .select('enabled')
    .eq('key', 'psn_lookup_enabled')
    .single();

  if (!flag?.enabled) {
    return NextResponse.json({
      success: false,
      error: 'PSN lookup is currently disabled',
      data: null,
      cached: false,
    });
  }

  const { onlineId } = await params;

  // TODO: Implement actual PSN lookup using psn-api
  // For now, return a placeholder response
  // Production implementation should:
  // 1. Check in-memory cache
  // 2. Rate-limit (30 req/min)
  // 3. Authenticate with NPSSO token
  // 4. universalSearch → accountId
  // 5. getProfileFromAccountId → profile
  // 6. getBasicPresence → presence
  // 7. getUserTrophyProfileSummary → trophies
  // 8. Cache result

  return NextResponse.json({
    success: true,
    cached: false,
    data: {
      accountId: null,
      onlineId,
      avatarUrl: null,
      aboutMe: null,
      isPlus: false,
      presenceState: 'unknown',
      presenceGame: null,
      trophyLevel: null,
      trophySummary: null,
      fetchedAt: new Date().toISOString(),
    },
    error: null,
  });
}
