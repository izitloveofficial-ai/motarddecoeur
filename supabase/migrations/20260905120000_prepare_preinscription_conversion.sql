-- Prepare the launch conversion workflow. This migration never creates Auth users
-- and never sends email; the campaign starts disabled.
alter table public.preinscriptions
  add column if not exists status text not null default 'pending',
  add column if not exists invitation_sent_at timestamptz,
  add column if not exists converted_at timestamptz,
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.preinscriptions drop constraint if exists preinscriptions_status_allowed;
alter table public.preinscriptions add constraint preinscriptions_status_allowed
  check (status in ('pending', 'invited', 'converted', 'declined', 'invalid'));
create unique index if not exists preinscriptions_user_id_unique
  on public.preinscriptions(user_id) where user_id is not null;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.invitation_campaign (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
insert into public.invitation_campaign(id, enabled) values (true, false)
on conflict (id) do nothing;

create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  location text,
  age integer,
  sex text,
  rider_profile text,
  favorite_bike text,
  primary_interest text,
  bio text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.invitation_campaign enable row level security;
alter table public.member_profiles enable row level security;

create policy "Admins read preinscriptions" on public.preinscriptions
  for select to authenticated using (public.is_admin());
create policy "Admins read campaign" on public.invitation_campaign
  for select to authenticated using (public.is_admin());
create policy "Members read own profile" on public.member_profiles
  for select to authenticated using (user_id = auth.uid());
create policy "Members update own profile" on public.member_profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Called only from an authenticated invitation session. Email matching and row
-- locks make repeated invitation clicks and concurrent finalisation idempotent.
create or replace function public.get_invited_preinscription(p_preinscription_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare registration public.preinscriptions; account_email text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select lower(email) into account_email from auth.users where id = auth.uid();
  select * into registration from public.preinscriptions where id = p_preinscription_id;
  if not found or lower(trim(registration.email)) <> account_email then raise exception 'invalid_invitation'; end if;
  if registration.status in ('declined', 'invalid') or not registration.consent_rgpd then raise exception 'invitation_not_eligible'; end if;
  return jsonb_build_object('first_name', registration.first_name,
    'location', coalesce(registration.location, registration.city), 'age', registration.age,
    'sex', registration.sex, 'rider_profile', registration.rider_profile,
    'favorite_bike', coalesce(registration.favorite_bike, registration.bike_type),
    'primary_interest', registration.primary_interest, 'bio', registration.message);
end $$;
revoke all on function public.get_invited_preinscription(uuid) from public;
grant execute on function public.get_invited_preinscription(uuid) to authenticated;

create or replace function public.finalize_preinscription(p_preinscription_id uuid, p_profile jsonb default '{}'::jsonb)
returns public.member_profiles
language plpgsql security definer set search_path = public
as $$
declare
  registration public.preinscriptions;
  result public.member_profiles;
  account_email text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select lower(email) into account_email from auth.users where id = auth.uid();
  select * into registration from public.preinscriptions
    where id = p_preinscription_id for update;
  if not found then raise exception 'invalid_invitation'; end if;
  if registration.status in ('declined', 'invalid') or not registration.consent_rgpd then
    raise exception 'invitation_not_eligible';
  end if;
  if lower(trim(registration.email)) <> account_email then raise exception 'email_mismatch'; end if;
  if registration.user_id is not null and registration.user_id <> auth.uid() then
    raise exception 'already_converted';
  end if;

  insert into public.member_profiles
    (user_id, first_name, location, age, sex, rider_profile, favorite_bike, primary_interest, bio)
  values
    (auth.uid(), coalesce(nullif(trim(p_profile->>'first_name'), ''), registration.first_name),
     coalesce(nullif(trim(p_profile->>'location'), ''), registration.location, registration.city),
     coalesce(nullif(p_profile->>'age', '')::integer, registration.age),
     coalesce(nullif(p_profile->>'sex', ''), registration.sex),
     coalesce(nullif(p_profile->>'rider_profile', ''), registration.rider_profile),
     coalesce(nullif(trim(p_profile->>'favorite_bike'), ''), registration.favorite_bike, registration.bike_type),
     coalesce(nullif(p_profile->>'primary_interest', ''), registration.primary_interest),
     coalesce(p_profile->>'bio', registration.message))
  on conflict (user_id) do nothing
  returning * into result;
  if result.user_id is null then
    select * into result from public.member_profiles where user_id = auth.uid();
  end if;

  update public.preinscriptions set
    user_id = auth.uid(), status = 'converted', converted_at = coalesce(converted_at, now())
  where id = registration.id;
  return result;
end $$;
revoke all on function public.finalize_preinscription(uuid, jsonb) from public;
grant execute on function public.finalize_preinscription(uuid, jsonb) to authenticated;
