/** Store domain types */

// -- Product Types --

export type ProductType = 'physical' | 'digital';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type ShippingMethod = 'pickup_mtaani_agent' | 'pickup_mtaani_doorstep' | 'pickup_mtaani_express' | 'digital';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  images: string[];
  thumbnail_url: string | null;
  product_type: ProductType;
  digital_file_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  stock_quantity: number | null;
  sku: string | null;
  weight_grams: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  category?: ProductCategory;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price_override: number | null;
  stock_quantity: number;
  sort_order: number;
  attributes: Record<string, string>;
}

// -- Order Types --

export interface ShippingAddress {
  name: string;
  phone: string;
  area_id?: number;
  zone_id?: number;
  agent_id?: number;
  location_id?: number;
  doorstep_destination_id?: number;
  location_name?: string;
  description?: string;
  lat?: number;
  lng?: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  total: number;
  currency: string;
  paystack_reference: string | null;
  paystack_transaction_id: string | null;
  shipping_method: ShippingMethod | null;
  shipping_address: ShippingAddress | null;
  pickup_mtaani_package_id: number | null;
  pickup_mtaani_track_id: string | null;
  tracking_receipt: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_snapshot: {
    name: string;
    image: string | null;
    sku: string | null;
    variant_name: string | null;
  };
}

// -- Cart Types --

export interface Cart {
  id: string;
  session_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  // Joined
  product?: Product;
  variant?: ProductVariant;
}

export interface CartWithItems extends Cart {
  items: CartItem[];
}

// -- PickupMtaani Types --

export interface PumZone {
  id: number;
  name: string;
}

export interface PumArea {
  id: number;
  name: string;
}

export interface PumLocation {
  id: number;
  name: string;
  zone_id: number;
}

export interface PumAgent {
  id: number;
  business_name: string;
}

export interface PumDoorstepDestination {
  id: number;
  name: string;
}

export interface PumDeliveryCharge {
  data: { price: number };
}

export interface PumExpressDirections {
  data: {
    distance: number;
    duration: number;
    price: number;
    gross_price: number;
  };
}
