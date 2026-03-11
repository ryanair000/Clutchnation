import { NextRequest, NextResponse } from 'next/server';
import { getAgentDeliveryCharge, getDoorstepDeliveryCharge } from '@/lib/pickupmtaani';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type');
  const senderAgentId = parseInt(process.env.PICKUPMTAANI_SENDER_AGENT_ID ?? '0', 10);

  try {
    if (type === 'agent') {
      const receiverAgentId = parseInt(req.nextUrl.searchParams.get('receiverAgentId') ?? '0', 10);
      if (!receiverAgentId) {
        return NextResponse.json({ error: 'Missing receiverAgentId' }, { status: 400 });
      }
      const charge = await getAgentDeliveryCharge(senderAgentId, receiverAgentId);
      return NextResponse.json({ charge });
    }

    if (type === 'doorstep') {
      const doorstepDestinationId = parseInt(
        req.nextUrl.searchParams.get('doorstepDestinationId') ?? '0',
        10
      );
      if (!doorstepDestinationId) {
        return NextResponse.json({ error: 'Missing doorstepDestinationId' }, { status: 400 });
      }
      const charge = await getDoorstepDeliveryCharge(senderAgentId, doorstepDestinationId);
      return NextResponse.json({ charge });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to calculate shipping' },
      { status: 500 }
    );
  }
}
