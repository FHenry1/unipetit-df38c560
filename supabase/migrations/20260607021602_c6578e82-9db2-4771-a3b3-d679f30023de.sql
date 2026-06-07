
-- 1) Profiles: restrict SELECT to authenticated users (hide phone/address from public)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 2) Reviews: enforce column-level rules via trigger
--    - Reviewers cannot change owner-only fields (owner_reply, owner_reply_at, owner_seen)
--    - Snackbar owners replying can only touch owner-only fields
CREATE OR REPLACE FUNCTION public.enforce_review_column_perms()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner boolean;
  is_reviewer boolean;
BEGIN
  is_reviewer := (auth.uid() IS NOT NULL AND auth.uid() = OLD.user_id);
  SELECT EXISTS (
    SELECT 1 FROM public.snackbars s
    WHERE s.id = OLD.snackbar_id AND s.owner_id = auth.uid()
  ) INTO is_owner;

  -- Reviewer (and not also owner) cannot modify owner-managed columns
  IF is_reviewer AND NOT is_owner THEN
    IF NEW.owner_reply IS DISTINCT FROM OLD.owner_reply
       OR NEW.owner_reply_at IS DISTINCT FROM OLD.owner_reply_at
       OR NEW.owner_seen IS DISTINCT FROM OLD.owner_seen THEN
      RAISE EXCEPTION 'Reviewers cannot modify owner reply fields';
    END IF;
  END IF;

  -- Owner (and not also reviewer) cannot modify customer-authored content
  IF is_owner AND NOT is_reviewer THEN
    IF NEW.rating IS DISTINCT FROM OLD.rating
       OR NEW.comment IS DISTINCT FROM OLD.comment
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.snackbar_id IS DISTINCT FROM OLD.snackbar_id THEN
      RAISE EXCEPTION 'Owners can only update reply fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_review_column_perms_trg ON public.reviews;
CREATE TRIGGER enforce_review_column_perms_trg
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_column_perms();

-- 3) Remove order_items from realtime publication (clients fetch items after order change)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_items'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.order_items';
  END IF;
END $$;
