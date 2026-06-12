
-- Allow nested trigger writes (e.g. recalc_snackbar_rating) to update rating/view_count
CREATE OR REPLACE FUNCTION public.prevent_snackbar_metric_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service_role and any update originating from another trigger
  IF current_setting('role', true) = 'service_role' OR pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.rating IS DISTINCT FROM OLD.rating THEN
    RAISE EXCEPTION 'rating is system-managed and cannot be modified directly';
  END IF;
  IF NEW.view_count IS DISTINCT FROM OLD.view_count THEN
    RAISE EXCEPTION 'view_count is system-managed and cannot be modified directly';
  END IF;
  RETURN NEW;
END;
$function$;

-- Remove duplicate recalc triggers, keep a single canonical one
DROP TRIGGER IF EXISTS reviews_recalc_rating ON public.reviews;
DROP TRIGGER IF EXISTS trg_recalc_snackbar_rating ON public.reviews;
