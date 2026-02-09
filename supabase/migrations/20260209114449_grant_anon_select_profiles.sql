-- The anon role needs the base table-level SELECT permission
-- in addition to the RLS policy created in the previous migration.
grant select on profiles to anon;
