
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE public.snackbars
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#e85d75',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS banner_url text;

CREATE TABLE IF NOT EXISTS public.snackbar_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snackbar_id uuid NOT NULL REFERENCES public.snackbars(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snackbar_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.snackbar_categories TO authenticated;
GRANT SELECT ON public.snackbar_categories TO anon;
GRANT ALL ON public.snackbar_categories TO service_role;

ALTER TABLE public.snackbar_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON public.snackbar_categories;
CREATE POLICY "Anyone can view categories"
  ON public.snackbar_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owner manages own categories" ON public.snackbar_categories;
CREATE POLICY "Owner manages own categories"
  ON public.snackbar_categories FOR ALL
  TO authenticated
  USING (snackbar_id IN (SELECT id FROM public.snackbars WHERE owner_id = auth.uid()))
  WITH CHECK (snackbar_id IN (SELECT id FROM public.snackbars WHERE owner_id = auth.uid()));
