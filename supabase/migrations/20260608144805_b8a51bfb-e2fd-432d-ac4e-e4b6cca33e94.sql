
-- 1) Reviews: restrict SELECT so reviewer user_id is not exposed broadly.
DROP POLICY IF EXISTS "Reviews are viewable by authenticated users" ON public.reviews;

CREATE POLICY "Users can view own reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Snackbar owners can view their reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.snackbars s
    WHERE s.id = reviews.snackbar_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RPC that returns reviews to all callers but masks user_id when not authorized.
CREATE OR REPLACE FUNCTION public.get_visible_reviews()
RETURNS TABLE(
  id uuid,
  snackbar_id uuid,
  user_id uuid,
  rating numeric,
  comment text,
  created_at timestamptz,
  owner_reply text,
  owner_reply_at timestamptz,
  owner_seen boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.snackbar_id,
    CASE
      WHEN auth.uid() IS NULL THEN NULL
      WHEN auth.uid() = r.user_id THEN r.user_id
      WHEN public.has_role(auth.uid(), 'admin') THEN r.user_id
      WHEN EXISTS (
        SELECT 1 FROM public.snackbars s
        WHERE s.id = r.snackbar_id AND s.owner_id = auth.uid()
      ) THEN r.user_id
      ELSE NULL
    END AS user_id,
    r.rating,
    r.comment,
    r.created_at,
    r.owner_reply,
    r.owner_reply_at,
    r.owner_seen
  FROM public.reviews r
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_visible_reviews() TO authenticated, anon;

-- 2) menu_items: require 'owner' role in addition to ownership.
DROP POLICY IF EXISTS "Owner can manage menu items" ON public.menu_items;

CREATE POLICY "Owner can manage menu items"
  ON public.menu_items FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner')
    AND EXISTS (
      SELECT 1 FROM public.snackbars s
      WHERE s.id = menu_items.snackbar_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'owner')
    AND EXISTS (
      SELECT 1 FROM public.snackbars s
      WHERE s.id = menu_items.snackbar_id AND s.owner_id = auth.uid()
    )
  );

-- 3) owner_applications: non-admins can only update their pending applications.
DROP POLICY IF EXISTS "Users can update own pending application" ON public.owner_applications;

CREATE POLICY "Users can update own pending application"
  ON public.owner_applications FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (auth.uid() = user_id AND status = 'pending')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (auth.uid() = user_id AND status = 'pending')
  );
