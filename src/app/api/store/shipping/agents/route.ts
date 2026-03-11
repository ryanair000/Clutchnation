import { NextRequest, NextResponse } from 'next/server';
import { getAgents } from '@/lib/pickupmtaani';

export async function GET(req: NextRequest) {
  try {
    const areaId = req.nextUrl.searchParams.get('areaId');
    const searchKey = req.nextUrl.searchParams.get('q') ?? undefined;
    // PuM agents are fetched by location; area maps to locations
    const agents = await getAgents({ searchKey });
    return NextResponse.json({ data: agents });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
