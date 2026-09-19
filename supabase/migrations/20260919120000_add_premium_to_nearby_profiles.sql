-- Keep the existing discovery implementation intact while extending its public
-- result with the Premium status.  The catalog-driven wrapper is intentional:
-- nearby_profiles predates the migrations tracked in this repository, so this
-- preserves its filters, exclusions, argument types and distance calculation.
do $migration$
declare
  target_oid oid;
  identity_arguments text;
  input_declarations text;
  input_references text;
  output_declarations text;
begin
  select p.oid, pg_get_function_identity_arguments(p.oid)
    into target_oid, identity_arguments
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

  execute format(
    'alter function public.nearby_profiles(%s) rename to nearby_profiles_without_premium',
    identity_arguments
  );

  execute format(
    $function$
      create function public.nearby_profiles(%s)
      returns table (%s, is_premium boolean)
      language sql
      stable
      security invoker
      set search_path = public
      as $body$
        select candidate.*, coalesce(profile.is_premium, false) as is_premium
        from public.nearby_profiles_without_premium(%s) as candidate
        join public.profiles as profile on profile.id = candidate.id
      $body$
    $function$,
    input_declarations,
    output_declarations,
    input_references
  );
end
$migration$;
