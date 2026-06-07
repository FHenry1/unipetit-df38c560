
CREATE OR REPLACE FUNCTION public.become_owner()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  sb_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
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

REVOKE ALL ON FUNCTION public.become_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.become_owner() TO authenticated;

CREATE OR REPLACE FUNCTION public.exit_owner_mode()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = uid AND role = 'owner';
END;
$$;

REVOKE ALL ON FUNCTION public.exit_owner_mode() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exit_owner_mode() TO authenticated;
