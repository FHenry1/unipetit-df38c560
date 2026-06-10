
-- 1. Prevent tampering with snackbars.rating and snackbars.view_count via direct API writes.
CREATE OR REPLACE FUNCTION public.prevent_snackbar_metric_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role (server-side admin code / triggers) to bypass.
  IF current_setting('role', true) = 'service_role' THEN
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
$$;

DROP TRIGGER IF EXISTS snackbars_prevent_metric_tampering ON public.snackbars;
CREATE TRIGGER snackbars_prevent_metric_tampering
BEFORE UPDATE ON public.snackbars
FOR EACH ROW EXECUTE FUNCTION public.prevent_snackbar_metric_tampering();

-- 2. Admin update/delete policies on profiles for moderation.
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
