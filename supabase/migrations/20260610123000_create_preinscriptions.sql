create table if not exists public.preinscriptions (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  email text not null,
  city text not null,
  age integer not null,
  sex text not null,
  bike_type text not null,
  message text,
  consent_rgpd boolean not null default false,
  created_at timestamptz not null default now(),

  constraint preinscriptions_first_name_length check (char_length(trim(first_name)) between 2 and 80),
  constraint preinscriptions_email_length check (char_length(trim(email)) between 5 and 254),
  constraint preinscriptions_city_length check (char_length(trim(city)) between 2 and 120),
  constraint preinscriptions_age_range check (age between 18 and 99),
  constraint preinscriptions_sex_allowed check (sex in ('femme', 'homme', 'non_binaire', 'prefere_ne_pas_dire', 'autre')),
  constraint preinscriptions_bike_type_length check (char_length(trim(bike_type)) between 2 and 120),
  constraint preinscriptions_message_length check (message is null or char_length(message) <= 1000),
  constraint preinscriptions_consent_required check (consent_rgpd is true)
);

create unique index if not exists preinscriptions_email_unique
  on public.preinscriptions (lower(trim(email)));

alter table public.preinscriptions enable row level security;

create policy "Allow public waitlist inserts"
  on public.preinscriptions
  for insert
  to anon
  with check (consent_rgpd is true);

-- No select, update, or delete policy is created on purpose: public visitors can submit,
-- but they cannot read, edit, or delete the pre-registration list.
