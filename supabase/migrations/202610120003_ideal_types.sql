-- Optional ideal-type preferences, visible only to approved FEVER members.
begin;
create table public.ideal_type_options (
 id uuid primary key default gen_random_uuid(),
 category text not null check(category in ('분위기','체형','성향','성격')),
 label text not null check(char_length(label) between 1 and 50),
 sort_order integer not null default 0,
 is_active boolean not null default true,
 unique(category,label)
);
insert into public.ideal_type_options(category,label,sort_order) values
 ('분위기','고양이상',1),('분위기','강아지상',2),
 ('체형','날씬한 편',1),('체형','탄탄한 편',2),('체형','든든한 편',3),
 ('성향','테토남',1),('성향','에겐남',2),('성향','테토녀',3),('성향','에겐녀',4),
 ('성격','다정함',1),('성격','유머 있는',2),('성격','차분함',3),('성격','활발함',4),('성격','배려심',5),('성격','솔직함',6);
create table public.profile_ideal_types (
 user_id uuid not null references public.profiles(id) on delete cascade,
 option_id uuid not null references public.ideal_type_options(id),
 primary key(user_id,option_id)
);
alter table public.ideal_type_options enable row level security;
alter table public.profile_ideal_types enable row level security;
revoke all on public.ideal_type_options,public.profile_ideal_types from anon,authenticated;
grant select on public.ideal_type_options,public.profile_ideal_types to authenticated;
create policy ideal_options_read on public.ideal_type_options for select to authenticated using(private.is_active());
create policy ideal_preferences_read on public.profile_ideal_types for select to authenticated using(
 user_id=auth.uid() or private.is_admin() or
 (private.is_active() and exists(select 1 from public.profiles p where p.id=user_id and p.membership_status='active'))
);
create function public.save_my_ideal_types(p_option_ids uuid[]) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_active() then raise exception 'FORBIDDEN'; end if;
 if p_option_ids is null or coalesce(array_length(p_option_ids,1),0)>30 then raise exception 'INVALID_SELECTION'; end if;
 if exists(select 1 from unnest(p_option_ids) chosen left join public.ideal_type_options o on o.id=chosen and o.is_active where o.id is null) then raise exception 'INVALID_SELECTION'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 delete from public.profile_ideal_types where user_id=auth.uid();
 insert into public.profile_ideal_types(user_id,option_id)
 select auth.uid(),chosen.id from (select distinct unnest(p_option_ids) id) chosen;
end;
$$;
revoke all on function public.save_my_ideal_types(uuid[]) from public,anon;
grant execute on function public.save_my_ideal_types(uuid[]) to authenticated;
commit;
