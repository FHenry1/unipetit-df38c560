
-- 1. Add user_id to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);

-- 2. Replace orders policies
DROP POLICY IF EXISTS "Authenticated can create order for existing snackbar" ON public.orders;
DROP POLICY IF EXISTS "Owners view their snackbar orders" ON public.orders;

CREATE POLICY "Customers create their own orders"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.snackbars s WHERE s.id = orders.snackbar_id)
  );

CREATE POLICY "Customers view their own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owners view their snackbar orders"
  ON public.orders FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.snackbars s
    WHERE s.id = orders.snackbar_id AND s.owner_id = auth.uid()
  ));

-- 3. Tighten order_items policies
DROP POLICY IF EXISTS "Authenticated insert items for existing order" ON public.order_items;
DROP POLICY IF EXISTS "Owners view items of their orders" ON public.order_items;

CREATE POLICY "Order participants insert items"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o
    LEFT JOIN public.snackbars s ON s.id = o.snackbar_id
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR s.owner_id = auth.uid())
  ));

CREATE POLICY "Order participants view items"
  ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    LEFT JOIN public.snackbars s ON s.id = o.snackbar_id
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR s.owner_id = auth.uid())
  ));

-- 4. Lock down realtime.messages (broadcast/presence) — deny by default.
-- postgres_changes still respects table RLS, so live order updates continue to work for owners/customers.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all broadcast access" ON realtime.messages;
CREATE POLICY "Deny all broadcast access"
  ON realtime.messages FOR SELECT TO authenticated
  USING (false);
