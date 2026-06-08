
-- Restrict reviews read access to authenticated users
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by authenticated users"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (true);

-- Strengthen snackbar update/delete policies with owner role check
DROP POLICY IF EXISTS "Owners can update own snackbar" ON public.snackbars;
CREATE POLICY "Owners can update own snackbar"
  ON public.snackbars
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Owners can delete own snackbar" ON public.snackbars;
CREATE POLICY "Owners can delete own snackbar"
  ON public.snackbars
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'::app_role));
