import { NextRequest, NextResponse } from 'next/server';
import { getDoorstepDestinations } from '@/lib/pickupmtaani';

export async function GET(req: NextRequest) {
  try {
    const areaId = req.nextUrl.searchParams.get('areaId');
    const dests = await getDoorstepDestinations({
      areaId: areaId ? parseInt(areaId, 10) : undefined,
    });
    return NextResponse.json({ data: dests });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch destinations' },
      { status: 500 }
    );
  }
}
