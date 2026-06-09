-- Enforce orders.user_id NOT NULL to close the RLS gap where null user_id rows would be invisible
DELETE FROM public.orders WHERE user_id IS NULL;
ALTER TABLE public.orders ALTER COLUMN user_id SET NOT NULL;