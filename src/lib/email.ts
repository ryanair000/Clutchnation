/**
 * Transactional email helpers — server-only.
 * Uses Resend API (raw fetch, no SDK required at this stage).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'ClutchNation Store <store@clutchnation.gg>';

async function sendEmail(params: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[email] Send failed (${res.status}): ${body}`);
  }
}

import { formatPrice } from './currency';

interface OrderEmailData {
  orderNumber: string;
  email: string;
  total: number;
  currency: string;
  items: { name: string; quantity: number; unitPrice: number; image?: string | null }[];
  shippingMethod?: string | null;
}

export async function sendOrderConfirmation(order: OrderEmailData) {
  const itemRows = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatPrice(i.unitPrice * i.quantity, order.currency)}</td>
        </tr>`
    )
    .join('');

  await sendEmail({
    to: order.email,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#2563EB">ClutchNation Store</h1>
        <h2>Order Confirmed! 🎉</h2>
        <p>Thanks for your order <strong>${order.orderNumber}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f8f9fa">
              <th style="padding:8px;text-align:left">Item</th>
              <th style="padding:8px;text-align:center">Qty</th>
              <th style="padding:8px;text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="font-size:18px;font-weight:bold">Total: ${formatPrice(order.total, order.currency)}</p>
        ${order.shippingMethod ? `<p>Shipping: ${order.shippingMethod.replace(/_/g, ' ')}</p>` : ''}
        <p style="color:#666;font-size:14px">We'll notify you when your order ships.</p>
      </div>
    `,
  });
}

export async function sendShippingUpdate(params: {
  email: string;
  orderNumber: string;
  trackId: string;
  receiptNo: string;
}) {
  await sendEmail({
    to: params.email,
    subject: `Your Order ${params.orderNumber} Has Shipped! 📦`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#2563EB">ClutchNation Store</h1>
        <h2>Your order is on its way!</h2>
        <p>Order <strong>${params.orderNumber}</strong> has been shipped via PickupMtaani.</p>
        <p>Tracking ID: <strong>${params.trackId}</strong></p>
        <p>Receipt: <strong>${params.receiptNo}</strong></p>
        <p style="color:#666;font-size:14px">You can track your delivery in the PickupMtaani app.</p>
      </div>
    `,
  });
}

export async function sendDigitalDelivery(params: {
  email: string;
  orderNumber: string;
  items: { name: string; downloadUrl: string }[];
}) {
  const links = params.items
    .map((i) => `<li><a href="${i.downloadUrl}">${i.name}</a></li>`)
    .join('');

  await sendEmail({
    to: params.email,
    subject: `Your Digital Purchase — ${params.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#2563EB">ClutchNation Store</h1>
        <h2>Your downloads are ready!</h2>
        <p>Order: <strong>${params.orderNumber}</strong></p>
        <ul>${links}</ul>
        <p style="color:#666;font-size:14px">Links expire in 7 days. Access them anytime from your order history.</p>
      </div>
    `,
  });
}
