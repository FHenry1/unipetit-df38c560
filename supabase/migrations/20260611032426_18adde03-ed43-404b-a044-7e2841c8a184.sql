
-- 1. Restrict owner_applications INSERT to status='pending'
DROP POLICY IF EXISTS "Users can insert own application" ON public.owner_applications;
CREATE POLICY "Users can insert own application"
ON public.owner_applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 2. Extend owner_applications trigger to cover INSERT too (force pending for non-admins)
CREATE OR REPLACE FUNCTION public.enforce_owner_application_perms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.reviewed_by := NULL;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Only admins can change status, reviewed_by, or user_id';
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Attach triggers (functions existed but no triggers were bound)
DROP TRIGGER IF EXISTS enforce_owner_application_perms_trg ON public.owner_applications;
CREATE TRIGGER enforce_owner_application_perms_trg
BEFORE INSERT OR UPDATE ON public.owner_applications
FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_application_perms();

DROP TRIGGER IF EXISTS enforce_review_column_perms_trg ON public.reviews;
CREATE TRIGGER enforce_review_column_perms_trg
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_review_column_perms();

-- 4. Attach metric-tampering trigger to snackbars (rating/view_count are system-managed)
DROP TRIGGER IF EXISTS prevent_snackbar_metric_tampering_trg ON public.snackbars;
CREATE TRIGGER prevent_snackbar_metric_tampering_trg
BEFORE UPDATE ON public.snackbars
FOR EACH ROW EXECUTE FUNCTION public.prevent_snackbar_metric_tampering();

-- 5. Attach recalc trigger for reviews -> snackbar rating
DROP TRIGGER IF EXISTS recalc_snackbar_rating_trg ON public.reviews;
CREATE TRIGGER recalc_snackbar_rating_trg
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recalc_snackbar_rating();
