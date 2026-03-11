import { NextRequest, NextResponse } from 'next/server';
import { getAreas } from '@/lib/pickupmtaani';

export async function GET(req: NextRequest) {
  try {
    const areas = await getAreas();
    const zoneId = req.nextUrl.searchParams.get('zoneId');
    const filtered = zoneId
      ? areas.filter((a) => String((a as unknown as { zone_id: number }).zone_id) === zoneId)
      : areas;
    return NextResponse.json({ data: filtered });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch areas' },
      { status: 500 }
    );
  }
}
