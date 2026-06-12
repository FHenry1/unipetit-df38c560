
DROP FUNCTION IF EXISTS public.get_visible_reviews();

CREATE FUNCTION public.get_visible_reviews()
 RETURNS TABLE(id uuid, snackbar_id uuid, user_id uuid, user_name text, rating numeric, comment text, created_at timestamp with time zone, owner_reply text, owner_reply_at timestamp with time zone, owner_seen boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    COALESCE(NULLIF(TRIM(p.name), ''), 'Usuário') AS user_name,
    r.rating,
    r.comment,
    r.created_at,
    r.owner_reply,
    r.owner_reply_at,
    r.owner_seen
  FROM public.reviews r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  ORDER BY r.created_at DESC;
$function$;
