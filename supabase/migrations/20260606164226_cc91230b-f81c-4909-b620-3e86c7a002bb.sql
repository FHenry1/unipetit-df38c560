
-- Owner reply + visibility tracking on reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS owner_reply text,
  ADD COLUMN IF NOT EXISTS owner_reply_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_seen boolean NOT NULL DEFAULT false;

-- Allow snackbar owner to update reply/seen fields on their reviews
DROP POLICY IF EXISTS "Owners can reply to their reviews" ON public.reviews;
CREATE POLICY "Owners can reply to their reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.snackbars s
    WHERE s.id = reviews.snackbar_id AND s.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.snackbars s
    WHERE s.id = reviews.snackbar_id AND s.owner_id = auth.uid()
  )
);

-- Ensure rating recalculation trigger is attached (function already exists)
DROP TRIGGER IF EXISTS trg_recalc_snackbar_rating ON public.reviews;
CREATE TRIGGER trg_recalc_snackbar_rating
AFTER INSERT OR UPDATE OF rating OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recalc_snackbar_rating();
