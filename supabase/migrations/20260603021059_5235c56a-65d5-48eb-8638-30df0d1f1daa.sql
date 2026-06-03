
-- Enum for roles
create type public.app_role as enum ('user', 'owner', 'admin');

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can view own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

-- Security definer function for role checks
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Snackbars table
create table public.snackbars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Minha Lanchonete',
  description text not null default '',
  location text not null default '',
  rating numeric(2,1) not null default 0,
  categories text[] not null default '{}',
  cover text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.snackbars to anon, authenticated;
grant insert, update, delete on public.snackbars to authenticated;
grant all on public.snackbars to service_role;

alter table public.snackbars enable row level security;

create policy "Snackbars are viewable by everyone"
  on public.snackbars for select using (true);

create policy "Owners can insert own snackbar"
  on public.snackbars for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "Owners can update own snackbar"
  on public.snackbars for update to authenticated
  using (auth.uid() = owner_id);

create policy "Owners can delete own snackbar"
  on public.snackbars for delete to authenticated
  using (auth.uid() = owner_id);

-- Menu items
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  snackbar_id uuid not null references public.snackbars(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  description text not null default '',
  image text,
  created_at timestamptz not null default now()
);

grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;
grant all on public.menu_items to service_role;

alter table public.menu_items enable row level security;

create policy "Menu items are viewable by everyone"
  on public.menu_items for select using (true);

create policy "Owner can manage menu items"
  on public.menu_items for all to authenticated
  using (exists (select 1 from public.snackbars s where s.id = menu_items.snackbar_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.snackbars s where s.id = menu_items.snackbar_id and s.owner_id = auth.uid()));

-- Favorites
create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  snackbar_id uuid not null references public.snackbars(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, snackbar_id)
);

grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;

alter table public.favorites enable row level security;

create policy "Users can view own favorites"
  on public.favorites for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can add own favorites"
  on public.favorites for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove own favorites"
  on public.favorites for delete to authenticated
  using (auth.uid() = user_id);

-- Trigger function to create profile and default role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));

  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger snackbars_set_updated_at
  before update on public.snackbars
  for each row execute function public.set_updated_at();
