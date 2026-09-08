-- Keep the legacy columns on public.preinscriptions for backwards compatibility,
-- while offering a focused view for day-to-day reading in Supabase.
create or replace view public.preinscriptions_readable
with (security_invoker = true)
as
select
  created_at,
  first_name,
  email,
  location,
  rider_profile,
  favorite_bike,
  primary_interest,
  message,
  consent_rgpd
from public.preinscriptions;

comment on view public.preinscriptions_readable is
  'Vue de lecture des champs utilisés par le formulaire actuel de pré-inscription.';

-- The view inherits the table RLS checks through security_invoker. Anonymous
-- visitors must never be able to read registrations; authenticated admins retain
-- read access through the existing policy on public.preinscriptions.
revoke all on public.preinscriptions_readable from anon;
revoke all on public.preinscriptions_readable from authenticated;
grant select on public.preinscriptions_readable to authenticated;
