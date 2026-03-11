'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Truck, Zap } from 'lucide-react';
import { useCart } from '@/components/store/cart-provider';
import { formatPrice } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { SHIPPING_METHODS } from '@/lib/constants';

type ShippingType = 'pickup' | 'doorstep' | 'digital';

interface LocationOption {
  id: number;
  name: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guest info
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Shipping
  const [shippingType, setShippingType] = useState<ShippingType>('pickup');
  const [zones, setZones] = useState<LocationOption[]>([]);
  const [areas, setAreas] = useState<LocationOption[]>([]);
  const [agents, setAgents] = useState<LocationOption[]>([]);
  const [doorstepDests, setDoorstepDests] = useState<LocationOption[]>([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedDoorstep, setSelectedDoorstep] = useState('');
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Check if cart is all-digital
  const allDigital = items.every((i) => i.product && (i.product as unknown as { product_type: string }).product_type === 'digital');

  useEffect(() => {
    if (allDigital) setShippingType('digital');
  }, [allDigital]);

  // Load zones on mount
  useEffect(() => {
    if (allDigital) return;
    fetch('/api/store/shipping/zones')
      .then((r) => r.json())
      .then((d) => setZones(d.data ?? []))
      .catch(() => {});
  }, [allDigital]);

  // Load areas when zone selected
  useEffect(() => {
    if (!selectedZone) return;
    fetch(`/api/store/shipping/areas?zoneId=${selectedZone}`)
      .then((r) => r.json())
      .then((d) => setAreas(d.data ?? []))
      .catch(() => {});
  }, [selectedZone]);

  // Load agents/doorstep when area selected
  useEffect(() => {
    if (!selectedArea) return;
    if (shippingType === 'pickup') {
      fetch(`/api/store/shipping/agents?areaId=${selectedArea}`)
        .then((r) => r.json())
        .then((d) => setAgents(d.data ?? []))
        .catch(() => {});
    } else if (shippingType === 'doorstep') {
      fetch(`/api/store/shipping/doorstep?areaId=${selectedArea}`)
        .then((r) => r.json())
        .then((d) => setDoorstepDests(d.data ?? []))
        .catch(() => {});
    }
  }, [selectedArea, shippingType]);

  // Calculate shipping cost
  useEffect(() => {
    if (shippingType === 'digital') {
      setShippingCost(0);
      return;
    }
    if (shippingType === 'pickup' && selectedAgent) {
      setLoadingShipping(true);
      fetch(`/api/store/shipping/charge?type=agent&receiverAgentId=${selectedAgent}`)
        .then((r) => r.json())
        .then((d) => setShippingCost(d.charge ?? null))
        .catch(() => setShippingCost(null))
        .finally(() => setLoadingShipping(false));
    } else if (shippingType === 'doorstep' && selectedDoorstep) {
      setLoadingShipping(true);
      fetch(`/api/store/shipping/charge?type=doorstep&doorstepDestinationId=${selectedDoorstep}`)
        .then((r) => r.json())
        .then((d) => setShippingCost(d.charge ?? null))
        .catch(() => setShippingCost(null))
        .finally(() => setLoadingShipping(false));
    } else {
      setShippingCost(null);
    }
  }, [shippingType, selectedAgent, selectedDoorstep]);

  const subtotal = items.reduce((sum, item) => {
    const unitPrice = item.product.price + (item.variant?.price_override ?? 0);
    return sum + unitPrice * item.quantity;
  }, 0);

  const total = subtotal + (shippingCost ?? 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          phone,
          shippingMethod: shippingType === 'pickup' ? 'pum_agent' : shippingType === 'doorstep' ? 'pum_doorstep' : 'digital',
          receiverAgentId: selectedAgent || undefined,
          doorstepDestinationId: selectedDoorstep || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed');

      // Redirect to Paystack
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (itemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-ink-500">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-ink-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-ink-900">Contact Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Full Name</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Phone</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254..." className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" />
            </div>
          </div>
        </section>

        {/* Shipping */}
        {!allDigital && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink-900">Shipping Method</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setShippingType('pickup'); setShippingCost(null); }}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-4 transition text-left',
                  shippingType === 'pickup' ? 'border-brand-500 bg-brand-50' : 'border-surface-200 hover:border-brand-300'
                )}
              >
                <MapPin className="h-5 w-5 text-brand-600 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Agent Pickup</p>
                  <p className="text-xs text-ink-400">Pick up at a PickupMtaani agent</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setShippingType('doorstep'); setShippingCost(null); }}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-4 transition text-left',
                  shippingType === 'doorstep' ? 'border-brand-500 bg-brand-50' : 'border-surface-200 hover:border-brand-300'
                )}
              >
                <Truck className="h-5 w-5 text-brand-600 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Doorstep Delivery</p>
                  <p className="text-xs text-ink-400">Delivered to your door</p>
                </div>
              </button>
            </div>

            {/* Location Selectors */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Zone</label>
                <select
                  required
                  value={selectedZone}
                  onChange={(e) => { setSelectedZone(e.target.value); setSelectedArea(''); setSelectedAgent(''); setSelectedDoorstep(''); }}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                >
                  <option value="">Select zone</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Area</label>
                <select
                  required
                  value={selectedArea}
                  onChange={(e) => { setSelectedArea(e.target.value); setSelectedAgent(''); setSelectedDoorstep(''); }}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                  disabled={!selectedZone}
                >
                  <option value="">Select area</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            {shippingType === 'pickup' && (
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Pickup Agent</label>
                <select
                  required
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                  disabled={!selectedArea}
                >
                  <option value="">Select agent</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}

            {shippingType === 'doorstep' && (
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Delivery Destination</label>
                <select
                  required
                  value={selectedDoorstep}
                  onChange={(e) => setSelectedDoorstep(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                  disabled={!selectedArea}
                >
                  <option value="">Select destination</option>
                  {doorstepDests.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}

            {loadingShipping && (
              <p className="text-sm text-ink-400 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Calculating shipping...
              </p>
            )}
          </section>
        )}

        {/* Order Summary */}
        <section className="rounded-xl border border-surface-200 bg-surface-50 p-6 space-y-3">
          <h2 className="font-semibold text-ink-900">Order Summary</h2>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-ink-600">
                {item.product.name} {item.variant ? `(${item.variant.name})` : ''} × {item.quantity}
              </span>
              <span className="font-medium">
                {formatPrice((item.product.price + (item.variant?.price_override ?? 0)) * item.quantity)}
              </span>
            </div>
          ))}
          <hr className="border-surface-200" />
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Shipping</span>
            <span>{shippingCost !== null ? formatPrice(shippingCost) : '—'}</span>
          </div>
          <hr className="border-surface-200" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || (shippingCost === null && !allDigital)}
          className="w-full rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Pay {formatPrice(total)}
        </button>
      </form>
    </div>
  );
}
