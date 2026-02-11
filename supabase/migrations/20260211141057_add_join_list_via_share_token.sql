-- Function that lets an authenticated user join a list via its share token.
-- SECURITY DEFINER bypasses RLS so the user can look up the list even though
-- they are not yet a collaborator (the chicken-and-egg problem).
create or replace function join_list_via_share_token(p_share_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list_id uuid;
  v_owner_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then return null; end if;

  select id, owner_id into v_list_id, v_owner_id
  from lists where share_token = p_share_token;

  if v_list_id is null then return null; end if;

  -- Owner doesn't need a collaborator row
  if v_owner_id = v_user_id then return v_list_id; end if;

  insert into list_collaborators (list_id, user_id)
  values (v_list_id, v_user_id)
  on conflict (list_id, user_id) do nothing;

  return v_list_id;
end;
$$;
