-- =====================================================================
-- Plexus: self-serve account deletion (migration 0004)
-- =====================================================================
-- Lets a signed-in player delete their own account from the Account screen.
-- The function deletes the caller's row in auth.users. Everything tied to it
-- goes with it through the existing ON DELETE CASCADE links:
--   profiles, user_progress, user_daily_results, race_players
-- (races they hosted keep the race row with host_user_id set to null).
--
-- It only ever deletes the account of the person calling it (auth.uid()), and
-- needs no service-role key in the app.
--
-- Run this in: Supabase Dashboard > SQL Editor > New query > paste > Run.
-- =====================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
