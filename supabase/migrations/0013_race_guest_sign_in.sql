-- 0013: signing in from a Race lobby keeps the seat.
--
-- A signed-out player races with an anonymous (guest) identity. If they sign
-- in while waiting in a lobby, the race server moves their seat from the guest
-- identity to their account, so the code, the opponent and Classic or Chaos
-- all stay as they were, and the race counts toward the account's Race rewards
-- under the usual rules. Only before the race starts, and only when the caller
-- proves both identities (the server checks the account session and the guest
-- session separately before calling this).
--
-- Chaos acceptance is cleared for the moved seat, because the account's own
-- loadout can differ from the guest's. Nothing else about the match changes.
-- Safe to run more than once.

create or replace function public.race_upgrade_guest(p_user uuid, p_guest uuid, p_match uuid) returns jsonb
language plpgsql as $$
declare m public.race_matches;
begin
  if p_user = p_guest then return public.race_state(p_user, p_match); end if;
  if exists (select 1 from auth.users u where u.id = p_user and coalesce(u.is_anonymous, false)) then
    return public.race_err('guest');
  end if;
  if not exists (select 1 from auth.users u where u.id = p_guest and coalesce(u.is_anonymous, false)) then
    return public.race_err('not-guest');
  end if;
  select * into m from public.race_matches where id = p_match for update;
  if not found or not exists (select 1 from public.race_participants where match_id = p_match and user_id = p_guest) then
    -- Already moved (a retry after a dropped response) or never there.
    if exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then
      return public.race_state(p_user, p_match);
    end if;
    return public.race_err('not-in-match');
  end if;
  if m.status <> 'lobby' then return public.race_err('not-in-lobby'); end if;
  if exists (select 1 from public.race_participants where match_id = p_match and user_id = p_user) then
    return public.race_err('already-in-match');
  end if;

  update public.race_participants
     set user_id = p_user, guest = false, level = public.race_player_level(p_user),
         chaos_accepted = false, equip_mutation = false, equip_crispr = false, temp_mutation = false, temp_crispr = false
   where match_id = p_match and user_id = p_guest;
  update public.race_matches set created_by = p_user where id = p_match and created_by = p_guest;
  update public.race_events set from_user = p_user where match_id = p_match and from_user = p_guest;
  update public.race_events set to_user = p_user where match_id = p_match and to_user = p_guest;
  return public.race_state(p_user, p_match);
end $$;

-- ---- only the server may call it ----
do $$
declare f text := 'race_upgrade_guest(uuid,uuid,uuid)';
begin
  execute format('revoke all on function public.%s from public', f);
  if exists (select 1 from pg_roles where rolname = 'anon') then execute format('revoke all on function public.%s from anon', f); end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then execute format('revoke all on function public.%s from authenticated', f); end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then execute format('grant execute on function public.%s to service_role', f); end if;
end $$;
