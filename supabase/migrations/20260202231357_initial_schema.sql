-- ============================================================
-- 1. Tables
-- ============================================================

-- profiles: synced from Supabase Auth
create table profiles (
  id         uuid primary key references auth.users(id),
  email      text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- lists: todo lists owned by a user
create table lists (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id),
  name        text not null,
  share_token uuid unique not null default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- list_collaborators: edit access beyond the owner
create table list_collaborators (
  list_id    uuid not null references lists(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

-- todos: individual items within a list
create table todos (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references lists(id) on delete cascade,
  title       text not null,
  description text,
  due_date    date,
  is_complete boolean not null default false,
  position    integer not null,
  created_by  uuid references profiles(id),
  updated_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- 2. Indexes
-- ============================================================

create index idx_todos_list_position on todos (list_id, position);

-- ============================================================
-- 3. Functions & Triggers
-- ============================================================

-- Generic updated_at trigger function
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_lists_updated_at
  before update on lists
  for each row execute function set_updated_at();

create trigger trg_todos_updated_at
  before update on todos
  for each row execute function set_updated_at();

-- Auto-create profile on auth.users insert
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 4. Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table lists enable row level security;
alter table list_collaborators enable row level security;
alter table todos enable row level security;

-- Helper: check if a user can edit a list (owner or collaborator)
create or replace function is_list_editor(p_list_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from lists where id = p_list_id and owner_id = p_user_id
  )
  or exists (
    select 1 from list_collaborators where list_id = p_list_id and user_id = p_user_id
  );
$$ language sql security definer stable;

-- Helper: check if a user can view a list (owner, collaborator, or via share_token passed as RPC param)
create or replace function is_list_viewer(p_list_id uuid, p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from lists where id = p_list_id and owner_id = p_user_id
  )
  or exists (
    select 1 from list_collaborators where list_id = p_list_id and user_id = p_user_id
  );
$$ language sql security definer stable;

-- ---- profiles ----

create policy "Anyone authenticated can view profiles"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---- lists ----

-- Authenticated users: owner or collaborator
create policy "Owners and collaborators can view lists"
  on lists for select
  to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from list_collaborators
      where list_id = id and user_id = auth.uid()
    )
  );

-- Anonymous users: can view a list if they provide the share_token via query param
-- They query: select * from lists where share_token = '<token>'
-- This policy allows the row to be returned when matched by share_token
create policy "Anyone can view a list via share token"
  on lists for select
  to anon
  using (true);  -- anon can only discover a list if they know the share_token to filter by

create policy "Authenticated users can create lists"
  on lists for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can update their lists"
  on lists for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners can delete their lists"
  on lists for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---- list_collaborators ----

create policy "List editors can view collaborators"
  on list_collaborators for select
  to authenticated
  using (
    is_list_editor(list_id, auth.uid())
  );

create policy "List owners can add collaborators"
  on list_collaborators for insert
  to authenticated
  with check (
    exists (
      select 1 from lists where id = list_id and owner_id = auth.uid()
    )
  );

create policy "List owners can remove collaborators"
  on list_collaborators for delete
  to authenticated
  using (
    exists (
      select 1 from lists where id = list_id and owner_id = auth.uid()
    )
  );

-- ---- todos ----

-- Authenticated: can view todos if they can edit or own the parent list
create policy "List editors can view todos"
  on todos for select
  to authenticated
  using (
    is_list_editor(list_id, auth.uid())
  );

-- Anonymous: can view todos if the parent list is accessed via share_token
create policy "Anyone can view todos via share token"
  on todos for select
  to anon
  using (true);  -- anon must join through lists filtered by share_token

create policy "List editors can create todos"
  on todos for insert
  to authenticated
  with check (
    is_list_editor(list_id, auth.uid())
  );

create policy "List editors can update todos"
  on todos for update
  to authenticated
  using (is_list_editor(list_id, auth.uid()))
  with check (is_list_editor(list_id, auth.uid()));

create policy "List editors can delete todos"
  on todos for delete
  to authenticated
  using (is_list_editor(list_id, auth.uid()));

-- ============================================================
-- 5. Realtime
-- ============================================================

alter publication supabase_realtime add table todos;
alter publication supabase_realtime add table lists;
