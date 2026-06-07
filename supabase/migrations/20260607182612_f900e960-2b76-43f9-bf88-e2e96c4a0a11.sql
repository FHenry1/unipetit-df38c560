
-- 1) Horários de abertura/fechamento da lanchonete
ALTER TABLE public.snackbars
  ADD COLUMN IF NOT EXISTS opening_time time,
  ADD COLUMN IF NOT EXISTS closing_time time;

-- 2) Categoria do item do menu
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS category text;

-- 3) Tabela de solicitações para se tornar dono
CREATE TABLE IF NOT EXISTS public.owner_applications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  business_name text NOT NULL DEFAULT '',
  document_url  text,
  notes         text,
  reviewed_by   uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.owner_applications TO authenticated;
GRANT ALL ON public.owner_applications TO service_role;

ALTER TABLE public.owner_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own application" ON public.owner_applications;
CREATE POLICY "Users can view own application"
  ON public.owner_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert own application" ON public.owner_applications;
CREATE POLICY "Users can insert own application"
  ON public.owner_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending application" ON public.owner_applications;
CREATE POLICY "Users can update own pending application"
  ON public.owner_applications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS set_owner_applications_updated_at ON public.owner_applications;
CREATE TRIGGER set_owner_applications_updated_at
  BEFORE UPDATE ON public.owner_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) RPC para admin aprovar dono
CREATE OR REPLACE FUNCTION public.admin_approve_owner(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not admin';
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (target_user_id, 'owner')
    ON CONFLICT DO NOTHING;
  INSERT INTO public.snackbars (owner_id, name, description, location, cover)
  SELECT target_user_id, 'Minha Lanchonete', 'Adicione uma descrição.', 'Endereço a definir',
         'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80'
  WHERE NOT EXISTS (SELECT 1 FROM public.snackbars WHERE owner_id = target_user_id);
  UPDATE public.owner_applications
     SET status = 'approved', reviewed_by = auth.uid(), updated_at = now()
   WHERE user_id = target_user_id;
END; $$;

-- 5) RPC para admin rejeitar dono
CREATE OR REPLACE FUNCTION public.admin_reject_owner(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not admin';
  END IF;
  UPDATE public.owner_applications
     SET status = 'rejected', reviewed_by = auth.uid(), updated_at = now()
   WHERE user_id = target_user_id;
END; $$;

-- 6) RPC para admin revogar dono
CREATE OR REPLACE FUNCTION public.admin_revoke_owner(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not admin';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = 'owner';
END; $$;

-- 7) Policy para admin excluir qualquer review
DROP POLICY IF EXISTS "Admin can delete any review" ON public.reviews;
CREATE POLICY "Admin can delete any review"
  ON public.reviews FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8) Policy para admin enxergar todos os profiles e roles
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;
CREATE POLICY "Admin can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
