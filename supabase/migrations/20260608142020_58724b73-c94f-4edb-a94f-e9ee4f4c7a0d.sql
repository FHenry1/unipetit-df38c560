CREATE POLICY "Admin can insert any snackbar"
ON public.snackbars FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete any snackbar"
ON public.snackbars FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));