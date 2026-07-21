create or replace function public.get_user_review_summary(
  p_user_id uuid
)
returns table (
  average_rating double precision,
  review_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  return query
  select
    coalesce(avg(r.rating)::double precision, 0) as average_rating,
    count(*) as review_count
  from public.reviews as r
  where r.reviewee_id = p_user_id;
end;
$$;

create or replace function public.get_user_reviews(
  p_user_id uuid,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  donation_id uuid,
  rating integer,
  comment text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  return query
  select
    r.donation_id,
    r.rating::integer,
    r.comment::text,
    r.created_at
  from public.reviews as r
  where r.reviewee_id = p_user_id
  order by r.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all
on function public.get_user_review_summary(uuid)
from public;

revoke all
on function public.get_user_reviews(uuid, integer, integer)
from public;

grant execute
on function public.get_user_review_summary(uuid)
to authenticated;

grant execute
on function public.get_user_reviews(uuid, integer, integer)
to authenticated;
