/**
 * PickupMtaani API client — server-only.
 * Docs: https://api.pickupmtaani.com/api/v1/docs/
 */

import { PICKUPMTAANI_API_BASE } from './constants';
import type {
  PumZone,
  PumArea,
  PumLocation,
  PumAgent,
  PumDoorstepDestination,
  PumDeliveryCharge,
  PumExpressDirections,
} from '@/types/store';

const API_KEY = process.env.PICKUPMTAANI_API_KEY!;
const BUSINESS_ID = process.env.PICKUPMTAANI_BUSINESS_ID!;

function headers() {
  return { apiKey: API_KEY, 'Content-Type': 'application/json' };
}

async function pumFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PICKUPMTAANI_API_BASE}${path}`, {
    ...init,
    headers: { ...headers(), ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PickupMtaani ${path} failed (${res.status}): ${body}`);
  }
  return res.json();
}

// ── Location Discovery ───────────────────────────────────────────────

export async function getZones(): Promise<PumZone[]> {
  const data = await pumFetch<{ data: PumZone[] }>('/locations/zones');
  return data.data;
}

export async function getAreas(): Promise<PumArea[]> {
  const data = await pumFetch<{ data: PumArea[] }>('/locations/areas');
  return data.data;
}

export async function getAgentLocations(params?: {
  areaId?: number;
  zoneId?: number;
  searchKey?: string;
}): Promise<PumLocation[]> {
  const sp = new URLSearchParams();
  if (params?.areaId) sp.set('areaId', String(params.areaId));
  if (params?.zoneId) sp.set('zoneId', String(params.zoneId));
  if (params?.searchKey) sp.set('searchKey', params.searchKey);
  const q = sp.toString();
  const data = await pumFetch<{ data: PumLocation[] }>(`/locations${q ? `?${q}` : ''}`);
  return data.data;
}

export async function getAgents(params?: {
  locationId?: number;
  searchKey?: string;
}): Promise<PumAgent[]> {
  const sp = new URLSearchParams();
  if (params?.locationId) sp.set('locationId', String(params.locationId));
  if (params?.searchKey) sp.set('searchKey', params.searchKey);
  const q = sp.toString();
  const data = await pumFetch<{ data: PumAgent[] }>(`/agents${q ? `?${q}` : ''}`);
  return data.data;
}

export async function getDoorstepDestinations(params?: {
  areaId?: number;
  searchKey?: string;
}): Promise<PumDoorstepDestination[]> {
  const sp = new URLSearchParams();
  if (params?.areaId) sp.set('areaId', String(params.areaId));
  if (params?.searchKey) sp.set('searchKey', params.searchKey);
  const q = sp.toString();
  const data = await pumFetch<{ data: PumDoorstepDestination[] }>(
    `/locations/doorstep-destinations${q ? `?${q}` : ''}`
  );
  return data.data;
}

// ── Delivery Pricing ─────────────────────────────────────────────────

export async function getAgentDeliveryCharge(
  senderAgentId: number,
  receiverAgentId: number
): Promise<number> {
  const data = await pumFetch<PumDeliveryCharge>(
    `/delivery-charge/agent-package?senderAgentID=${senderAgentId}&receiverAgentID=${receiverAgentId}`
  );
  return data.data.price;
}

export async function getDoorstepDeliveryCharge(
  senderAgentId: number,
  doorstepDestinationId: number
): Promise<number> {
  const data = await pumFetch<PumDeliveryCharge>(
    `/delivery-charge/doorstep-package?senderAgentID=${senderAgentId}&doorstepDestinationID=${doorstepDestinationId}`
  );
  return data.data.price;
}

export async function getExpressDirections(
  coordinates: [number, number][],
  riderTypeId: number
): Promise<PumExpressDirections['data']> {
  const data = await pumFetch<PumExpressDirections>(
    `/packages/express/directions?b_id=${BUSINESS_ID}`,
    {
      method: 'POST',
      body: JSON.stringify({ coordinates, rider_type_id: riderTypeId }),
    }
  );
  return data.data;
}

// ── Package Creation ─────────────────────────────────────────────────

export async function createAgentPackage(params: {
  senderAgentId: number;
  receiverAgentId: number;
  customerName: string;
  customerPhone: string;
  packageName: string;
  packageValue: number;
}): Promise<{ trackId: string; receiptNo: string; id: number }> {
  const data = await pumFetch<{ data: { id: number; trackId: string; receipt_no: string } }>(
    `/packages/agent-agent?b_id=${BUSINESS_ID}`,
    {
      method: 'POST',
      body: JSON.stringify({
        senderAgentID_id: params.senderAgentId,
        receieverAgentID_id: params.receiverAgentId,
        customerName: params.customerName,
        customerPhoneNumber: params.customerPhone,
        packageName: params.packageName,
        packageValue: params.packageValue,
        paymentOption: 'vendor',
      }),
    }
  );
  return { trackId: data.data.trackId, receiptNo: data.data.receipt_no, id: data.data.id };
}

export async function createDoorstepPackage(params: {
  senderAgentId: number;
  doorstepDestinationId: number;
  customerName: string;
  customerPhone: string;
  packageName: string;
  packageValue: number;
  locationDescription?: string;
  lat?: number;
  lng?: number;
}): Promise<{ trackId: string; receiptNo: string; id: number }> {
  const data = await pumFetch<{ data: { id: number; trackId: string; receipt_no: string } }>(
    `/packages/doorstep?b_id=${BUSINESS_ID}`,
    {
      method: 'POST',
      body: JSON.stringify({
        senderAgentID_id: params.senderAgentId,
        doorstepDestinationId: params.doorstepDestinationId,
        customerName: params.customerName,
        customerPhoneNumber: params.customerPhone,
        packageName: params.packageName,
        packageValue: params.packageValue,
        paymentOption: 'vendor',
        locationDescription: params.locationDescription,
        lat: params.lat,
        lng: params.lng,
      }),
    }
  );
  return { trackId: data.data.trackId, receiptNo: data.data.receipt_no, id: data.data.id };
}

// ── Package Tracking ────────────────────────────────────────────────

export async function getAgentPackage(id: number) {
  return pumFetch<{ data: Record<string, unknown> }>(
    `/packages/agent-agent?id=${id}&b_id=${BUSINESS_ID}`
  );
}

export async function getDoorstepPackage(id: number) {
  return pumFetch<{ data: Record<string, unknown> }>(
    `/packages/doorstep?id=${id}&b_id=${BUSINESS_ID}`
  );
}

// ── Webhook Registration ────────────────────────────────────────────

export async function registerWebhook(webhookUrl: string) {
  return pumFetch<{ message: string }>('/webhooks/register', {
    method: 'POST',
    body: JSON.stringify({ webhook_url: webhookUrl }),
  });
}
