
-- Fix set_updated_at search_path
create or replace function public.set_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Revoke execute from public/anon/authenticated for SECURITY DEFINER functions
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- has_role is called from RLS policies via SQL (runs in the policy context, not via API)
-- Re-grant only to authenticated for direct calls if needed
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
