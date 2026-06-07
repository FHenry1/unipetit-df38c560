
ALTER TABLE public.snackbars ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_snackbar_views(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.snackbars SET view_count = view_count + 1 WHERE id = _id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_snackbar_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_snackbar_views(uuid) TO anon, authenticated;
