-- Keep directory statistics accurate without transferring every provider row
-- through PostgREST. Grouping by city + category preserves the combinations
-- needed for canonical facets and popular-search links.

create or replace function public.get_service_directory_facets()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with grouped as (
    select
      city,
      category,
      count(*)::integer as count
    from public.service_providers
    where status = 'approved'
    group by city, category
  )
  select jsonb_build_object(
    'rows',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'city', grouped.city,
            'category', grouped.category,
            'count', grouped.count
          )
          order by grouped.count desc, grouped.city, grouped.category
        )
        from grouped
      ),
      '[]'::jsonb
    ),
    'directoryTotal',
    (
      select count(*)::integer
      from public.service_providers
      where status = 'approved'
    ),
    'verifiedCount',
    (
      select count(*)::integer
      from public.service_providers
      where status = 'approved'
        and is_verified = true
    )
  );
$$;

revoke all on function public.get_service_directory_facets() from public;
grant execute on function public.get_service_directory_facets() to anon, authenticated;
