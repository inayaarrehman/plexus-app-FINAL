-- 0014: Race functions that read auth.users run as their owner.
--
-- The race server calls the database as Supabase's service_role, which (in
-- current Supabase projects) cannot read auth.users. Four race functions check
-- auth.users (guest or not, account age), so creating a race failed with
-- "permission denied for table users". Making those functions SECURITY DEFINER
-- (with a fixed search_path) lets them read it as their owner. They stay
-- callable by service_role only: anon and signed-in players cannot run them.
-- Safe to run more than once.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'race\_%' and p.prosrc ilike '%auth.users%' and not p.prosecdef
  loop
    execute format('alter function %s security definer set search_path = public, pg_temp', f.sig);
    raise notice 'fixed %', f.sig;
  end loop;
end $$;

select p.oid::regprocedure as function,
       p.prosecdef as fixed,
       has_function_privilege('anon', p.oid, 'execute') as anon_can_run,
       has_function_privilege('authenticated', p.oid, 'execute') as players_can_run
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like 'race\_%' and p.prosrc ilike '%auth.users%';
