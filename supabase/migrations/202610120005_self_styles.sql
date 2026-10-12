-- A member's own style uses the same vocabulary as ideal-type preferences.
begin;
create table public.profile_self_types (
 user_id uuid not null references public.profiles(id) on delete cascade,
 option_id uuid not null references public.ideal_type_options(id),
 primary key(user_id,option_id)
);
create index profile_self_types_option_idx on public.profile_self_types(option_id,user_id);
alter table public.profile_self_types enable row level security;
revoke all on public.profile_self_types from anon,authenticated;
grant select on public.profile_self_types to authenticated;
create policy self_styles_read on public.profile_self_types for select to authenticated using(
 user_id=auth.uid() or private.is_admin() or
 (private.is_active() and exists(select 1 from public.profiles p where p.id=user_id and p.membership_status='active'))
);
create function public.save_my_self_types(p_option_ids uuid[]) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_active() then raise exception 'FORBIDDEN'; end if;
 if p_option_ids is null or coalesce(array_length(p_option_ids,1),0)>30 then raise exception 'INVALID_SELECTION'; end if;
 if exists(select 1 from unnest(p_option_ids) chosen left join public.ideal_type_options o on o.id=chosen and o.is_active where o.id is null) then raise exception 'INVALID_SELECTION'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 delete from public.profile_self_types where user_id=auth.uid();
 insert into public.profile_self_types(user_id,option_id)
 select auth.uid(),chosen.id from (select distinct unnest(p_option_ids) id) chosen;
end;
$$;
revoke all on function public.save_my_self_types(uuid[]) from public,anon;
grant execute on function public.save_my_self_types(uuid[]) to authenticated;
commit;
