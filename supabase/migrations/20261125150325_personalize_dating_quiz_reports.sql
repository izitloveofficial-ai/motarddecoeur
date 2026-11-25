-- Keep legacy questions, answers and registrations intact. Add a versioned six-answer report.
alter table public.love_quiz_participations
  drop constraint love_quiz_participations_answers_check,
  add constraint love_quiz_participations_answers_check check (
    array_ndims(answers)=1 and array_position(answers,null) is null
    and answers <@ array[0,1,2] and (
      (quiz_version='2026-11-22-v1' and cardinality(answers)=5)
      or (quiz_version='2026-11-25-v2' and cardinality(answers)=6)
    )
  ),
  drop constraint love_quiz_participations_result_profile_check,
  add constraint love_quiz_participations_result_profile_check check (
    (quiz_version='2026-11-22-v1' and result_profile in ('aventure','complicite','epicurien'))
    or (quiz_version='2026-11-25-v2' and result_profile='bilan')
  );

-- Distinct RPC name keeps existing clients working while the new frontend is published.
create function public.record_dating_quiz(p_id uuid,p_first_name text,p_email text,p_answers integer[],p_preinscribe boolean,p_ip_hash text,p_consent_version text,p_quiz_version text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare existing public.love_quiz_participations; registration_id uuid;
begin
  if p_quiz_version is distinct from '2026-11-25-v2'
    or p_consent_version is distinct from 'quiz-2026-11-25-v2'
    or p_answers is null or array_ndims(p_answers) is distinct from 1
    or cardinality(p_answers)<>6 or array_position(p_answers,null) is not null
    or not (p_answers <@ array[0,1,2]) then
    raise exception 'invalid_request';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('love_quiz_id:'||p_id::text,0));
  perform pg_advisory_xact_lock(hashtextextended('love_quiz:'||p_ip_hash,0));
  perform pg_advisory_xact_lock(hashtextextended('love_quiz_email:'||p_email,0));
  select * into existing from public.love_quiz_participations where id=p_id;
  if found then
    if existing.email<>p_email or existing.answers<>p_answers or existing.first_name<>p_first_name
      or existing.preinscribe<>p_preinscribe or existing.quiz_version<>p_quiz_version
      or existing.consent_version<>p_consent_version then
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
  insert into public.love_quiz_participations(id,first_name,email,answers,result_profile,quiz_version,consent_version,preinscribe,preinscription_id,ip_hash)
    values(p_id,p_first_name,p_email,p_answers,'bilan',p_quiz_version,p_consent_version,p_preinscribe,registration_id,p_ip_hash);
  return jsonb_build_object('id',p_id,'email_status','pending','preinscribed',p_preinscribe);
end $$;
revoke all on function public.record_dating_quiz(uuid,text,text,integer[],boolean,text,text,text) from public,anon,authenticated;
grant execute on function public.record_dating_quiz(uuid,text,text,integer[],boolean,text,text,text) to service_role;
