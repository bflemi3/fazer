-- Add position column to lists table for drag-to-reorder

-- 1. Add nullable column first
alter table lists add column position integer;

-- 2. Backfill: assign sequential positions per owner, ordered by created_at DESC (newest = 0)
update lists
set position = sub.pos
from (
  select id, row_number() over (partition by owner_id order by created_at desc) - 1 as pos
  from lists
) sub
where lists.id = sub.id;

-- 3. Set NOT NULL and DEFAULT
alter table lists alter column position set not null;
alter table lists alter column position set default 0;

-- 4. Add index for efficient ordering
create index idx_lists_owner_position on lists (owner_id, position);
