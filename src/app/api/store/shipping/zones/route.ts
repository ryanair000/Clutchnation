import { NextRequest, NextResponse } from 'next/server';
import { getZones } from '@/lib/pickupmtaani';

export async function GET() {
  try {
    const zones = await getZones();
    return NextResponse.json({ data: zones });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}
