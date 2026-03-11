'use client';

import { useState } from 'react';

const COUNTRY_CODES = [
  { code: '+254', flag: '🇰🇪', label: 'KE' },
  { code: '+255', flag: '🇹🇿', label: 'TZ' },
  { code: '+256', flag: '🇺🇬', label: 'UG' },
  { code: '+251', flag: '🇪🇹', label: 'ET' },
  { code: '+234', flag: '🇳🇬', label: 'NG' },
  { code: '+27', flag: '🇿🇦', label: 'ZA' },
  { code: '+233', flag: '🇬🇭', label: 'GH' },
] as const;

export function InviteFriendModal({ onClose }: { onClose: () => void }) {
  const [countryCode, setCountryCode] = useState('+254');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fullPhone = `${countryCode}${phone.replace(/^0+/, '')}`;

  async function handleSend() {
    if (!phone || phone.replace(/\D/g, '').length < 7) {
      setResult({ type: 'error', message: 'Enter a valid phone number' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, channel }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ type: 'error', message: data.error ?? 'Failed to send invite' });
        setLoading(false);
        return;
      }

      if (data.waUrl) {
        // Open WhatsApp in new tab
        window.open(data.waUrl, '_blank', 'noopener');
        setResult({ type: 'success', message: 'WhatsApp opened! Send the message to your friend.' });
      } else {
        setResult({ type: 'success', message: 'SMS invite sent!' });
      }

      setPhone('');
    } catch {
      setResult({ type: 'error', message: 'Network error — try again' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-ink-light hover:text-ink transition-colors"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="font-heading text-xl font-bold text-ink">Invite a Friend</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Send an invite via SMS or WhatsApp. Grow the community!
        </p>

        {/* Channel toggle */}
        <div className="mt-5 flex rounded-lg border border-surface-200 p-1">
          <button
            type="button"
            onClick={() => setChannel('whatsapp')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              channel === 'whatsapp'
                ? 'bg-green-500 text-white'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setChannel('sms')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              channel === 'sms'
                ? 'bg-brand text-white'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            SMS
          </button>
        </div>

        {/* Phone input */}
        <div className="mt-4 flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-28 rounded-lg border border-surface-300 px-2 py-2.5 text-sm focus:border-brand focus:ring-brand"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="712345678"
            maxLength={12}
            className="flex-1 rounded-lg border border-surface-300 px-3 py-2.5 text-sm focus:border-brand focus:ring-brand"
          />
        </div>
        <p className="mt-1 text-xs text-ink-light">
          Enter number without leading zero
        </p>

        {/* Result */}
        {result && (
          <div
            className={`mt-3 rounded-lg px-4 py-2.5 text-sm ${
              result.type === 'success'
                ? 'bg-accent-50 text-accent-700'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {result.message}
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={loading || !phone}
          className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
            channel === 'whatsapp'
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-brand hover:bg-brand-600'
          }`}
        >
          {loading
            ? 'Sending...'
            : channel === 'whatsapp'
              ? 'Open WhatsApp'
              : 'Send SMS Invite'}
        </button>

        {/* Share link fallback */}
        <div className="mt-4 border-t border-surface-100 pt-4">
          <p className="text-xs font-medium text-ink-light">Or share this link</p>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/signup`}
              className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs text-ink-muted"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/signup`);
                setResult({ type: 'success', message: 'Link copied!' });
              }}
              className="rounded-lg border border-surface-300 px-3 py-2 text-xs font-medium text-ink hover:bg-surface-50 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
