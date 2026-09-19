-- Add the three profile attributes to discovery without replacing the existing
-- six-argument overload. Keeping that overload makes existing RPC callers fully
-- backwards compatible, while PostgREST selects this overload when the three new
-- named arguments are supplied.
do $migration$
declare
  target_oid oid;
  input_declarations text;
  input_references text;
  output_declarations text;
  rider_role_type text;
  experience_level_type text;
  riding_pace_type text;
begin
  select p.oid
    into target_oid
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'nearby_profiles'
    and array_length(p.proargtypes, 1) = 6;

  if target_oid is null then
    raise exception 'public.nearby_profiles with six input arguments was not found';
  end if;

  select
    string_agg(
      format('%I %s', argument_name, format_type(argument_type, null)),
      ', ' order by position
    ),
    string_agg(format('$%s', position), ', ' order by position)
    into input_declarations, input_references
  from (
    select
      argument_types.position,
      argument_types.argument_type,
      p.proargnames[argument_types.position] as argument_name
    from pg_proc p
    cross join lateral unnest(p.proallargtypes, p.proargmodes)
      with ordinality as argument_types(argument_type, argument_mode, position)
    where p.oid = target_oid
      and argument_types.argument_mode in ('i', 'b', 'v')
  ) input_arguments;

  select string_agg(
    format('%I %s', argument_name, format_type(argument_type, null)),
    ', ' order by position
  )
    into output_declarations
  from (
    select
      argument_types.position,
      argument_types.argument_type,
      p.proargnames[argument_types.position] as argument_name
    from pg_proc p
    cross join lateral unnest(p.proallargtypes, p.proargmodes)
      with ordinality as argument_types(argument_type, argument_mode, position)
    where p.oid = target_oid
      and argument_types.argument_mode = 't'
  ) output_arguments;

  select format_type(a.atttypid, a.atttypmod)
    into rider_role_type
  from pg_attribute a
  where a.attrelid = 'public.profiles'::regclass
    and a.attname = 'rider_role'
    and a.attnum > 0
    and not a.attisdropped;

  select format_type(a.atttypid, a.atttypmod)
    into experience_level_type
  from pg_attribute a
  where a.attrelid = 'public.profiles'::regclass
    and a.attname = 'experience_level'
    and a.attnum > 0
    and not a.attisdropped;

  select format_type(a.atttypid, a.atttypmod)
    into riding_pace_type
  from pg_attribute a
  where a.attrelid = 'public.profiles'::regclass
    and a.attname = 'riding_pace'
    and a.attnum > 0
    and not a.attisdropped;

  if rider_role_type is null or experience_level_type is null or riding_pace_type is null then
    raise exception 'One or more discovery filter columns are missing from public.profiles';
  end if;

  execute format(
    $function$
      create function public.nearby_profiles(
        %s,
        p_rider_role %s,
        p_experience_level %s,
        p_riding_pace %s
      )
      returns table (%s)
      language sql
      stable
      security invoker
      set search_path = public
      as $body$
        select candidate.*
        from public.nearby_profiles(%s) as candidate
        join public.profiles as p on p.id = candidate.id
        where (p_rider_role is null or p.rider_role = p_rider_role)
          and (p_experience_level is null or p.experience_level = p_experience_level)
          and (p_riding_pace is null or p.riding_pace = p_riding_pace)
      $body$
    $function$,
    input_declarations,
    rider_role_type,
    experience_level_type,
    riding_pace_type,
    output_declarations,
    input_references
  );
end
$migration$;
