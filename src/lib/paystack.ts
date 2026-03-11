/**
 * Paystack API helpers — server-only.
 * Uses raw fetch (no SDK needed).
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE = 'https://api.paystack.co';

function headers() {
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    currency: string;
    customer: { email: string };
    metadata: Record<string, unknown>;
    paid_at: string | null;
  };
}

/**
 * Initialize a Paystack transaction (redirects customer to Paystack checkout).
 */
export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo/cents (smallest currency unit)
  currency?: string;
  reference: string;
  metadata?: Record<string, unknown>;
  callback_url: string;
}): Promise<PaystackInitResponse> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      currency: params.currency ?? 'KES',
      reference: params.reference,
      metadata: params.metadata,
      callback_url: params.callback_url,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paystack initialize failed (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Verify a Paystack transaction by reference.
 */
export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { method: 'GET', headers: headers() }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paystack verify failed (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Generate a unique Paystack reference.
 */
export function generateReference(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `CN-${ts}-${rand}`;
}

/**
 * Verify Paystack webhook signature (HMAC SHA-512).
 */
export async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(PAYSTACK_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex === signature;
}
