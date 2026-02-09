-- Supabase Realtime needs REPLICA IDENTITY FULL on tables with RLS
-- so that DELETE events include the full row for policy evaluation.
-- Without this, DELETE events are silently dropped by Realtime.
ALTER TABLE todos REPLICA IDENTITY FULL;
ALTER TABLE lists REPLICA IDENTITY FULL;
