
CREATE TYPE public.order_status AS ENUM ('pending','preparing','ready','delivered','cancelled');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snackbar_id uuid NOT NULL REFERENCES public.snackbars(id) ON DELETE CASCADE,
  customer_name text NOT NULL DEFAULT 'Cliente',
  total numeric(10,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Owners view their snackbar orders" ON public.orders FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.snackbars s WHERE s.id = snackbar_id AND s.owner_id = auth.uid()));

CREATE POLICY "Anyone authenticated can create order" ON public.orders FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Owners update their snackbar orders" ON public.orders FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.snackbars s WHERE s.id = snackbar_id AND s.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.snackbars s WHERE s.id = snackbar_id AND s.owner_id = auth.uid()));

CREATE POLICY "Owners delete their snackbar orders" ON public.orders FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.snackbars s WHERE s.id = snackbar_id AND s.owner_id = auth.uid()));

-- Order items policies
CREATE POLICY "Owners view items of their orders" ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.snackbars s ON s.id = o.snackbar_id
  WHERE o.id = order_id AND s.owner_id = auth.uid()
));

CREATE POLICY "Anyone authenticated insert items" ON public.order_items FOR INSERT TO authenticated
WITH CHECK (true);

CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- Seed a couple demo pending orders for each existing snackbar (so dashboard isn't empty)
INSERT INTO public.orders (snackbar_id, customer_name, total, status, notes)
SELECT s.id, 'Cliente Demo', 18.50, 'pending', 'Sem cebola'
FROM public.snackbars s;
