-- Store a full birth date at registration. Month/day remain private unless a member opts in.
begin;
alter table public.profile_birthdates add column birthday_visible boolean not null default false;

create function public.submit_membership(
 p_nickname text,p_birth_year integer,p_region text,p_avatar_path text,
 p_terms_version text,p_privacy_version text,p_gender text,
 p_birth_month integer,p_birth_day integer
) returns void language plpgsql security definer set search_path='' as $$
declare birthday date;
begin
 if p_gender is null or p_gender not in ('male','female') then raise exception 'INVALID_GENDER'; end if;
 if p_birth_year is null or p_birth_month is null or p_birth_day is null then raise exception 'INVALID_BIRTHDATE'; end if;
 begin birthday:=make_date(p_birth_year,p_birth_month,p_birth_day);
 exception when datetime_field_overflow then raise exception 'INVALID_BIRTHDATE'; end;
 if birthday>(now() at time zone 'Asia/Seoul')::date then raise exception 'INVALID_BIRTHDATE'; end if;
 perform public.submit_membership(p_nickname,p_birth_year,p_region,p_avatar_path,p_terms_version,p_privacy_version);
 update public.profiles set gender=p_gender where id=auth.uid();
 insert into public.profile_birthdates(user_id,birth_month,birth_day,birthday_visible)
 values(auth.uid(),p_birth_month,p_birth_day,true)
 on conflict(user_id) do update set birth_month=excluded.birth_month,birth_day=excluded.birth_day,
 birthday_visible=true,updated_at=now();
end;
$$;
revoke all on function public.submit_membership(text,integer,text,text,text,text,text,integer,integer) from public,anon;
grant execute on function public.submit_membership(text,integer,text,text,text,text,text,integer,integer) to authenticated;
revoke execute on function public.submit_membership(text,integer,text,text,text,text) from authenticated;

-- Existing birthday rows stay private. Saving again after the updated notice opts in.
create or replace function public.save_my_birthdate(p_month integer,p_day integer,p_consent boolean) returns void language plpgsql security definer set search_path='' as $$
declare year_value integer; date_value date;
begin
 if not private.is_active() then raise exception 'FORBIDDEN'; end if;
 if p_consent is distinct from true then raise exception 'CONSENT_REQUIRED'; end if;
 select birth_year into year_value from public.profiles where id=auth.uid();
 if year_value is null or p_month is null or p_day is null or p_month not between 1 and 12 or p_day not between 1 and 31 then raise exception 'INVALID_BIRTHDATE'; end if;
 begin date_value:=make_date(year_value,p_month,p_day); exception when datetime_field_overflow then raise exception 'INVALID_BIRTHDATE'; end;
 if date_value>current_date then raise exception 'INVALID_BIRTHDATE'; end if;
 insert into public.profile_birthdates(user_id,birth_month,birth_day,consented_at,updated_at,birthday_visible)
 values(auth.uid(),p_month,p_day,now(),now(),true)
 on conflict(user_id) do update set birth_month=excluded.birth_month,birth_day=excluded.birth_day,consented_at=now(),updated_at=now(),birthday_visible=true;
end;
$$;

create function public.month_birthdays(p_month integer)
returns table(user_id uuid,nickname text,birth_day smallint,gender text)
language plpgsql stable security definer set search_path='' as $$
begin
 if not private.is_active() then raise exception 'FORBIDDEN'; end if;
 if p_month is null or p_month not between 1 and 12 then raise exception 'INVALID_MONTH'; end if;
 return query select p.id,p.nickname,b.birth_day,p.gender
 from public.profile_birthdates b join public.profiles p on p.id=b.user_id
 where b.birth_month=p_month and b.birthday_visible and p.membership_status='active'
 order by b.birth_day,p.nickname limit 50;
end;
$$;
revoke all on function public.month_birthdays(integer) from public,anon;
grant execute on function public.month_birthdays(integer) to authenticated;
commit;
