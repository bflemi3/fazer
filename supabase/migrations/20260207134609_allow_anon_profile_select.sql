-- Allow anonymous users to read profiles (needed for shared list pages
-- to display the list owner's name and avatar)
create policy "Anyone can view profiles"
  on profiles for select
  to anon
  using (true);
