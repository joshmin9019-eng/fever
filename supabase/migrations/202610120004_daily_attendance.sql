-- A saved answer to today's question records one check-in for that Korea date.
begin;
create table public.daily_attendance (
 user_id uuid not null references public.profiles(id) on delete cascade,
 attendance_date date not null,
 question_id uuid not null references public.questions(id),
 checked_in_at timestamptz not null default now(),
 primary key(user_id,attendance_date)
);
alter table public.daily_attendance enable row level security;
revoke all on public.daily_attendance from anon,authenticated;
grant select on public.daily_attendance to authenticated;
create policy daily_attendance_own_read on public.daily_attendance for select to authenticated
 using(user_id=auth.uid() and private.is_active());

create function private.daily_question_for_date(p_day date) returns uuid
 language sql stable security definer set search_path='' as $$
 select q.id from public.questions q
 join public.question_categories c on c.id=q.category_id
 where q.is_active and c.is_active
 order by q.id
 offset ((p_day-date '2020-01-01') % greatest((
  select count(*) from public.questions q2 join public.question_categories c2 on c2.id=q2.category_id
  where q2.is_active and c2.is_active
 ),1)) limit 1
 $$;
revoke all on function private.daily_question_for_date(date) from public,anon,authenticated;

create function private.record_daily_attendance() returns trigger
 language plpgsql security definer set search_path='' as $$
declare local_day date;
begin
 if new.hidden_at is not null or new.deleted_at is not null then return new; end if;
 local_day:=(new.updated_at at time zone 'Asia/Seoul')::date;
 if new.question_id=private.daily_question_for_date(local_day) then
  insert into public.daily_attendance(user_id,attendance_date,question_id,checked_in_at)
  values(new.user_id,local_day,new.question_id,new.updated_at)
  on conflict(user_id,attendance_date) do nothing;
 end if;
 return new;
end;
$$;
revoke all on function private.record_daily_attendance() from public,anon,authenticated;
create trigger record_daily_attendance_after_answer after insert or update of text_value,option_id,deleted_at on public.answers
 for each row execute function private.record_daily_attendance();
commit;
