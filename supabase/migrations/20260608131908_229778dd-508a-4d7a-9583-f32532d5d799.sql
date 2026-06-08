ALTER TABLE public.snackbars
  ADD COLUMN IF NOT EXISTS opening_time time,
  ADD COLUMN IF NOT EXISTS closing_time time;

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS category text;