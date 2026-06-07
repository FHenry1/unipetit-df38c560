
-- 1) Profiles: tighten SELECT to own profile only
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Public-safe view exposing only non-sensitive columns (id + name + avatar)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false)
AS
SELECT id, name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 2) Snackbars: require verified owner role on insert
DROP POLICY IF EXISTS "Owners can insert own snackbar" ON public.snackbars;

CREATE POLICY "Owners can insert own snackbar"
ON public.snackbars
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id
  AND public.has_role(auth.uid(), 'owner'::public.app_role)
);

-- 3) Orders: remove from realtime publication (unused, prevents cross-user leak)
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
