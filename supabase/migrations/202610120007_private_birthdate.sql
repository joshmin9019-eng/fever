-- Optional birthday details for FEVER's original entertainment horoscope.
-- The public profile continues to show only birth year; month/day stay self-only.
begin;
create table public.profile_birthdates (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 birth_month smallint not null check(birth_month between 1 and 12),
 birth_day smallint not null check(birth_day between 1 and 31),
 consented_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.profile_birthdates enable row level security;
revoke all on public.profile_birthdates from anon,authenticated;
grant select on public.profile_birthdates to authenticated;
create policy birthdate_self_read on public.profile_birthdates for select to authenticated using(user_id=auth.uid());
create function public.save_my_birthdate(p_month integer,p_day integer,p_consent boolean) returns void language plpgsql security definer set search_path='' as $$
declare year_value integer; date_value date;
begin
 if not private.is_active() then raise exception 'FORBIDDEN'; end if;
 if p_consent is distinct from true then raise exception 'CONSENT_REQUIRED'; end if;
 select birth_year into year_value from public.profiles where id=auth.uid();
 if year_value is null or p_month is null or p_day is null or p_month not between 1 and 12 or p_day not between 1 and 31 then raise exception 'INVALID_BIRTHDATE'; end if;
 begin date_value:=make_date(year_value,p_month,p_day); exception when datetime_field_overflow then raise exception 'INVALID_BIRTHDATE'; end;
 if date_value>current_date then raise exception 'INVALID_BIRTHDATE'; end if;
 insert into public.profile_birthdates(user_id,birth_month,birth_day,consented_at,updated_at)
 values(auth.uid(),p_month,p_day,now(),now())
 on conflict(user_id) do update set birth_month=excluded.birth_month,birth_day=excluded.birth_day,consented_at=now(),updated_at=now();
end;
$$;
create function public.delete_my_birthdate() returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_active() then raise exception 'FORBIDDEN'; end if;
 delete from public.profile_birthdates where user_id=auth.uid();
end;
$$;
revoke all on function public.save_my_birthdate(integer,integer,boolean),public.delete_my_birthdate() from public,anon;
grant execute on function public.save_my_birthdate(integer,integer,boolean),public.delete_my_birthdate() to authenticated;
commit;
