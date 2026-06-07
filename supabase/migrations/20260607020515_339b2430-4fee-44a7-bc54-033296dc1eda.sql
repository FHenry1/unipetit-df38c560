ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS menu_items_snackbar_position_idx
  ON public.menu_items (snackbar_id, position);

-- Initialize position for existing rows based on creation order
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY snackbar_id ORDER BY created_at) - 1 AS rn
  FROM public.menu_items
)
UPDATE public.menu_items m SET position = r.rn FROM ranked r WHERE m.id = r.id;