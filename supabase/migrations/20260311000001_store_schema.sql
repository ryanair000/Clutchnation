-- ClutchNation Store — Database Schema
-- Tables: product_categories, products, product_variants, orders, order_items, carts, cart_items
-- Storage: product-images, digital-goods

-- =============================================================================
-- PRODUCT CATEGORIES
-- =============================================================================
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- PRODUCTS
-- =============================================================================
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.product_categories(id),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price integer NOT NULL CHECK (price >= 0),
  compare_at_price integer CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  currency text NOT NULL DEFAULT 'KES',
  images text[] NOT NULL DEFAULT '{}',
  thumbnail_url text,
  product_type text NOT NULL CHECK (product_type IN ('physical', 'digital')),
  digital_file_url text,
  is_active boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  stock_quantity integer,
  sku text,
  weight_grams integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- PRODUCT VARIANTS
-- =============================================================================
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  price_override integer CHECK (price_override IS NULL OR price_override >= 0),
  stock_quantity integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  attributes jsonb NOT NULL DEFAULT '{}'
);

-- =============================================================================
-- ORDERS
-- =============================================================================
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES public.profiles(id),
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal integer NOT NULL CHECK (subtotal >= 0),
  shipping_cost integer NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total integer NOT NULL CHECK (total >= 0),
  currency text NOT NULL DEFAULT 'KES',
  paystack_reference text UNIQUE,
  paystack_transaction_id text,
  shipping_method text
    CHECK (shipping_method IS NULL OR shipping_method IN ('pickup_mtaani_agent', 'pickup_mtaani_doorstep', 'pickup_mtaani_express', 'digital')),
  shipping_address jsonb,
  pickup_mtaani_package_id integer,
  pickup_mtaani_track_id text,
  tracking_receipt text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- ORDER ITEMS
-- =============================================================================
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  variant_id uuid REFERENCES public.product_variants(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  total_price integer NOT NULL CHECK (total_price >= 0),
  product_snapshot jsonb NOT NULL DEFAULT '{}'
);

-- =============================================================================
-- CARTS
-- =============================================================================
CREATE TABLE public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  user_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT carts_owner_check CHECK (session_id IS NOT NULL OR user_id IS NOT NULL)
);

-- =============================================================================
-- CART ITEMS
-- =============================================================================
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  variant_id uuid REFERENCES public.product_variants(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  CONSTRAINT cart_items_unique_product UNIQUE (cart_id, product_id, variant_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active_featured ON public.products(is_active, is_featured);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_email ON public.orders(email);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_carts_session ON public.carts(session_id);
CREATE INDEX idx_carts_user ON public.carts(user_id);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.store_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.store_set_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.store_set_updated_at();

CREATE TRIGGER carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.store_set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- ----- PRODUCT CATEGORIES -----
CREATE POLICY "categories_select_public" ON public.product_categories
  FOR SELECT USING (true);

CREATE POLICY "categories_admin_insert" ON public.product_categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "categories_admin_update" ON public.product_categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "categories_admin_delete" ON public.product_categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ----- PRODUCTS -----
CREATE POLICY "products_select_public" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "products_select_admin" ON public.products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "products_admin_insert" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "products_admin_update" ON public.products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "products_admin_delete" ON public.products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ----- PRODUCT VARIANTS -----
CREATE POLICY "variants_select_public" ON public.product_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND is_active = true)
  );

CREATE POLICY "variants_select_admin" ON public.product_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "variants_admin_insert" ON public.product_variants
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "variants_admin_update" ON public.product_variants
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "variants_admin_delete" ON public.product_variants
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ----- ORDERS -----
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "orders_insert_anyone" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ----- ORDER ITEMS -----
CREATE POLICY "order_items_select_via_order" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (
        o.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
      )
    )
  );

CREATE POLICY "order_items_insert_anyone" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- ----- CARTS -----
CREATE POLICY "carts_select_own" ON public.carts
  FOR SELECT USING (
    (session_id IS NOT NULL AND session_id = current_setting('request.cookies.cn_cart_session', true))
    OR user_id = auth.uid()
  );

CREATE POLICY "carts_insert_anyone" ON public.carts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "carts_update_own" ON public.carts
  FOR UPDATE USING (
    (session_id IS NOT NULL AND session_id = current_setting('request.cookies.cn_cart_session', true))
    OR user_id = auth.uid()
  );

CREATE POLICY "carts_delete_own" ON public.carts
  FOR DELETE USING (
    (session_id IS NOT NULL AND session_id = current_setting('request.cookies.cn_cart_session', true))
    OR user_id = auth.uid()
  );

-- ----- CART ITEMS -----
CREATE POLICY "cart_items_select_via_cart" ON public.cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.carts c WHERE c.id = cart_id
      AND (
        (c.session_id IS NOT NULL AND c.session_id = current_setting('request.cookies.cn_cart_session', true))
        OR c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "cart_items_insert_via_cart" ON public.cart_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts c WHERE c.id = cart_id
      AND (
        (c.session_id IS NOT NULL AND c.session_id = current_setting('request.cookies.cn_cart_session', true))
        OR c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "cart_items_update_via_cart" ON public.cart_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.carts c WHERE c.id = cart_id
      AND (
        (c.session_id IS NOT NULL AND c.session_id = current_setting('request.cookies.cn_cart_session', true))
        OR c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "cart_items_delete_via_cart" ON public.cart_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.carts c WHERE c.id = cart_id
      AND (
        (c.session_id IS NOT NULL AND c.session_id = current_setting('request.cookies.cn_cart_session', true))
        OR c.user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('digital-goods', 'digital-goods', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- product-images: public read, admin upload
CREATE POLICY "product_images_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "product_images_update_admin" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "product_images_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- digital-goods: private, admin upload, purchaser download
CREATE POLICY "digital_goods_select_purchaser" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'digital-goods'
    AND (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
      OR EXISTS (
        SELECT 1 FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id
        JOIN public.products p ON p.id = oi.product_id
        WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
        AND (o.user_id = auth.uid())
        AND p.digital_file_url LIKE '%' || storage.filename(name)
      )
    )
  );

CREATE POLICY "digital_goods_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'digital-goods'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================================================
-- SEED: Default Categories
-- =============================================================================
INSERT INTO public.product_categories (name, slug, sort_order) VALUES
  ('Apparel', 'apparel', 1),
  ('Collectibles', 'collectibles', 2),
  ('Gaming Accessories', 'gaming-accessories', 3),
  ('Digital Goods', 'digital-goods', 4),
  ('Stickers & Patches', 'stickers-patches', 5);
