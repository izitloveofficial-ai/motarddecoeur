alter table public.preinscriptions
  add column if not exists location text,
  add column if not exists rider_profile text,
  add column if not exists favorite_bike text,
  add column if not exists primary_interest text;

alter table public.preinscriptions
  alter column city drop not null,
  alter column age drop not null,
  alter column sex drop not null,
  alter column bike_type drop not null;

alter table public.preinscriptions
  add constraint preinscriptions_location_length
    check (location is null or char_length(trim(location)) between 2 and 120),
  add constraint preinscriptions_rider_profile_allowed
    check (rider_profile is null or rider_profile in ('motard', 'motarde', 'passager_passagere', 'passionne_moto', 'permis_en_cours')),
  add constraint preinscriptions_favorite_bike_length
    check (favorite_bike is null or char_length(trim(favorite_bike)) between 2 and 120),
  add constraint preinscriptions_primary_interest_allowed
    check (primary_interest is null or primary_interest in ('rencontre_serieuse', 'balades_moto', 'amitie', 'communaute_motards', 'indecis'));
