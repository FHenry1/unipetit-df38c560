
CREATE OR REPLACE FUNCTION public.admin_revoke_owner(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not admin';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = 'owner';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_approve_owner(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not admin';
  END IF;

  INSERT INTO public.user_roles(user_id, role)
    VALUES (target_user_id, 'owner')
    ON CONFLICT DO NOTHING;

  INSERT INTO public.snackbars (owner_id, name, description, location, cover)
  SELECT target_user_id, 'Minha Lanchonete', 'Adicione uma descrição.', 'Endereço a definir',
         'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80'
  WHERE NOT EXISTS (SELECT 1 FROM public.snackbars WHERE owner_id = target_user_id);

  UPDATE public.owner_applications
    SET status = 'approved', reviewed_by = auth.uid(), updated_at = now()
    WHERE user_id = target_user_id;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reviews' AND policyname = 'Admin can delete any review'
  ) THEN
    CREATE POLICY "Admin can delete any review"
      ON public.reviews FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;
