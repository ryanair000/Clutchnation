/**
 * Africa's Talking SMS integration — server-only.
 * Uses raw fetch (no SDK) to send SMS and WhatsApp messages.
 * Docs: https://developers.africastalking.com/docs/sms/sending
 */

const AT_API_KEY = process.env.AFRICASTALKING_API_KEY;
const AT_USERNAME = process.env.AFRICASTALKING_USERNAME;
const AT_SENDER_ID = process.env.AFRICASTALKING_SENDER_ID; // optional, falls back to shared short code
const AT_BASE_URL = AT_USERNAME === 'sandbox'
  ? 'https://api.sandbox.africastalking.com'
  : 'https://api.africastalking.com';

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a single SMS via Africa's Talking.
 * Phone number must be in international format (e.g. +254712345678).
 */
export async function sendSms(to: string, message: string): Promise<SmsResult> {
  if (!AT_API_KEY || !AT_USERNAME) {
    console.warn('[africastalking] API key or username not set — skipping SMS');
    return { success: false, error: 'SMS not configured' };
  }

  const params = new URLSearchParams({
    username: AT_USERNAME,
    to,
    message,
    ...(AT_SENDER_ID ? { from: AT_SENDER_ID } : {}),
  });

  try {
    const res = await fetch(`${AT_BASE_URL}/version1/messaging`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        apiKey: AT_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[africastalking] SMS failed (${res.status}): ${body}`);
      return { success: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const recipient = data?.SMSMessageData?.Recipients?.[0];

    if (recipient?.status === 'Success') {
      return { success: true, messageId: recipient.messageId };
    }

    return {
      success: false,
      error: recipient?.status ?? 'Unknown error',
    };
  } catch (err) {
    console.error('[africastalking] SMS error:', err);
    return { success: false, error: 'Network error' };
  }
}
