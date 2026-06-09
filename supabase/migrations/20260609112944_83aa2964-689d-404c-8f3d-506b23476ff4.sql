
-- 1) Harden become_owner: require an approved owner_application
CREATE OR REPLACE FUNCTION public.become_owner()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  sb_id uuid;
  has_approved boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only users with an approved application OR already-owner role may proceed
  SELECT EXISTS (
    SELECT 1 FROM public.owner_applications
    WHERE user_id = uid AND status = 'approved'
  ) INTO has_approved;

  IF NOT has_approved AND NOT public.has_role(uid, 'owner') THEN
    RAISE EXCEPTION 'Owner application not approved';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'owner')
  ON CONFLICT (user_id, role) DO NOTHING;

  SELECT id INTO sb_id FROM public.snackbars WHERE owner_id = uid LIMIT 1;

  IF sb_id IS NULL THEN
    INSERT INTO public.snackbars (owner_id, name, description, location, cover)
    VALUES (
      uid,
      'Minha Lanchonete',
      'Adicione uma descrição da sua lanchonete.',
      'Endereço a definir',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80'
    )
    RETURNING id INTO sb_id;
  END IF;

  RETURN sb_id;
END;
$$;

-- 2) Trigger to prevent non-admins from changing status/reviewed_by on owner_applications
CREATE OR REPLACE FUNCTION public.enforce_owner_application_perms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Only admins can change status, reviewed_by, or user_id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_owner_application_perms_trg ON public.owner_applications;
CREATE TRIGGER enforce_owner_application_perms_trg
  BEFORE UPDATE ON public.owner_applications
  FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_application_perms();
