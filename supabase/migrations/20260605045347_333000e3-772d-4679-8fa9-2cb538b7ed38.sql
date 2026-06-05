
DROP POLICY "Anyone authenticated can create order" ON public.orders;
CREATE POLICY "Authenticated can create order for existing snackbar" ON public.orders FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.snackbars s WHERE s.id = snackbar_id));

DROP POLICY "Anyone authenticated insert items" ON public.order_items;
CREATE POLICY "Authenticated insert items for existing order" ON public.order_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id));
