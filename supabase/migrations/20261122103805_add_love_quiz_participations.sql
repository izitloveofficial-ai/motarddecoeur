-- Additive: no changes to existing accounts, profiles or preinscriptions.
create table public.love_quiz_participations (
  id uuid primary key,
  first_name text not null check (char_length(first_name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 254),
  answers integer[] not null check (cardinality(answers)=5 and answers <@ array[0,1,2]),
  result_profile text not null check (result_profile in ('aventure','complicite','epicurien')),
  quiz_version text not null default '2026-11-22-v1',
  consent_version text not null,
  consented_at timestamptz not null default now(),
  preinscribe boolean not null,
  preinscription_id uuid references public.preinscriptions(id) on delete set null,
  ip_hash text,
  email_status text not null default 'pending' check (email_status in ('pending','sending','sent','failed')),
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.love_quiz_participations enable row level security;
revoke all on public.love_quiz_participations from anon, authenticated;
grant select on public.love_quiz_participations to authenticated;
grant all on public.love_quiz_participations to service_role;
create policy "Only admins read quiz participations" on public.love_quiz_participations
  for select to authenticated using ((select public.is_admin()));
create index love_quiz_email_created on public.love_quiz_participations (email,created_at desc);
create index love_quiz_ip_created on public.love_quiz_participations (ip_hash,created_at desc);

-- Service-only transactional write, rate limit and optional preinscription.
create function public.record_love_quiz(p_id uuid,p_first_name text,p_email text,p_answers integer[],p_result text,p_preinscribe boolean,p_ip_hash text,p_consent_version text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare existing public.love_quiz_participations; registration_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('love_quiz:'||p_ip_hash,0));
  perform pg_advisory_xact_lock(hashtextextended('love_quiz_email:'||p_email,0));
  select * into existing from public.love_quiz_participations where id=p_id;
  if found then
    if existing.email<>p_email or existing.answers<>p_answers or existing.first_name<>p_first_name or existing.preinscribe<>p_preinscribe then
      raise exception 'request_conflict';
    end if;
    return jsonb_build_object('id',existing.id,'email_status',existing.email_status,'preinscribed',existing.preinscribe);
  end if;
  if (select count(*) from public.love_quiz_participations where ip_hash=p_ip_hash and created_at>now()-interval '1 hour') >= 5
    or (select count(*) from public.love_quiz_participations where email=p_email and created_at>now()-interval '1 day') >= 2 then
    raise exception 'rate_limited';
  end if;
  if p_preinscribe then
    insert into public.preinscriptions(first_name,email,consent_rgpd)
      values(p_first_name,p_email,true) on conflict do nothing returning id into registration_id;
    if registration_id is null then
      select id into registration_id from public.preinscriptions where lower(trim(email))=p_email limit 1;
    end if;
  end if;
  insert into public.love_quiz_participations(id,first_name,email,answers,result_profile,consent_version,preinscribe,preinscription_id,ip_hash)
    values(p_id,p_first_name,p_email,p_answers,p_result,p_consent_version,p_preinscribe,registration_id,p_ip_hash);
  return jsonb_build_object('id',p_id,'email_status','pending','preinscribed',p_preinscribe);
end $$;
revoke all on function public.record_love_quiz(uuid,text,text,integer[],text,boolean,text,text) from public,anon,authenticated;
grant execute on function public.record_love_quiz(uuid,text,text,integer[],text,boolean,text,text) to service_role;

