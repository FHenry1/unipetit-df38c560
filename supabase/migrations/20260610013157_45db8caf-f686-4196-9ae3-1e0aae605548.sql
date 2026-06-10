
-- 1. Explicit admin-only INSERT/DELETE on user_roles (defense in depth; RLS is enabled and previously had no INSERT/DELETE policy, so this codifies deny-by-default for non-admins).
CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Remove owner_applications from realtime publication to prevent CDC leakage.
ALTER PUBLICATION supabase_realtime DROP TABLE public.owner_applications;
