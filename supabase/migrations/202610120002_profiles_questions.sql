-- Phase 3: member profiles, interests, and nickname review.
begin;
alter table public.profiles add column gender text, add column job text, add column mbti text, add column bio text;
alter table public.profiles add constraint profile_optional_fields check (
 (gender is null or gender in ('male','female')) and
 (job is null or char_length(job) <= 80) and
 (mbti is null or mbti ~ '^[IE][NS][FT][JP]$') and
 (bio is null or char_length(bio) <= 500)
);
create table public.interests (
 id uuid primary key default gen_random_uuid(), label text not null unique,
 is_active boolean not null default true, sort_order integer not null default 0
);
insert into public.interests(label,sort_order) values
 ('여행',1),('영화',2),('음악',3),('독서',4),('운동',5),('맛집',6),('게임',7),('사진',8),('전시',9),('반려동물',10);
create table public.profile_interests (
 user_id uuid not null references public.profiles(id) on delete cascade,
 interest_id uuid not null references public.interests(id),
 primary key(user_id,interest_id)
);
create table public.nickname_change_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id),
 proposed_nickname text not null check(proposed_nickname ~ '^[가-힣A-Za-z0-9_]{2,20}$'),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 requested_at timestamptz not null default now(),
 reviewed_by uuid references public.profiles(id), reviewed_at timestamptz
);
create unique index one_pending_nickname on public.nickname_change_requests(user_id) where status='pending';
alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;
alter table public.nickname_change_requests enable row level security;
revoke all on public.interests,public.profile_interests,public.nickname_change_requests from anon,authenticated;
grant select on public.interests,public.profile_interests,public.nickname_change_requests to authenticated;
create policy interests_read on public.interests for select to authenticated using(private.is_active());
create policy profile_interests_read on public.profile_interests for select to authenticated using(
 private.is_admin() or (private.is_active() and exists(select 1 from public.profiles where id=user_id and membership_status='active'))
);
create policy nickname_requests_read on public.nickname_change_requests for select to authenticated using(user_id=auth.uid() or private.is_admin());
drop policy avatar_insert on storage.objects;
create policy avatar_insert on storage.objects for insert to authenticated with check(
 bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.profiles where id=auth.uid() and membership_status in ('pending_email','rejected','active'))
);
create function public.update_my_profile(
 p_birth_year integer,p_region text,p_gender text,p_job text,p_mbti text,p_bio text,
 p_avatar_path text,p_interest_ids uuid[]
) returns void language plpgsql security definer set search_path='' as $$
declare current_profile public.profiles;
begin
 if not private.is_active() then raise exception 'FORBIDDEN'; end if;
 select * into current_profile from public.profiles where id=auth.uid() for update;
 if current_profile.id is null then raise exception 'PROFILE_NOT_FOUND'; end if;
 if p_birth_year is null or p_birth_year<1 or p_birth_year>extract(year from now() at time zone 'Asia/Seoul') then raise exception 'INVALID_BIRTH_YEAR'; end if;
 if p_region is null or char_length(trim(p_region)) not between 1 and 100 then raise exception 'INVALID_REGION'; end if;
 if p_gender is not null and p_gender not in ('male','female') or p_job is not null and char_length(p_job)>80 or p_bio is not null and char_length(p_bio)>500 or p_mbti is not null and p_mbti !~ '^[IE][NS][FT][JP]$' then raise exception 'INVALID_PROFILE'; end if;
 if p_interest_ids is null or coalesce(array_length(p_interest_ids,1),0)>30 then raise exception 'INVALID_INTERESTS'; end if;
 if exists(select 1 from unnest(p_interest_ids) requested left join public.interests i on i.id=requested and i.is_active where i.id is null) then raise exception 'INVALID_INTERESTS'; end if;
 if p_avatar_path is not null and not exists(
  select 1 from storage.objects where bucket_id='avatars' and name=p_avatar_path and owner_id=auth.uid()::text
  and (storage.foldername(name))[1]=auth.uid()::text and (metadata->>'mimetype') in ('image/jpeg','image/png','image/webp')
  and (metadata->>'size')::bigint between 1 and 5242880
 ) then raise exception 'INVALID_AVATAR'; end if;
 update public.profiles set birth_year=p_birth_year,region=trim(p_region),gender=nullif(trim(p_gender),''),job=nullif(trim(p_job),''),
 mbti=nullif(p_mbti,''),bio=nullif(trim(p_bio),''),avatar_path=coalesce(p_avatar_path,avatar_path),updated_at=now() where id=auth.uid();
 delete from public.profile_interests where user_id=auth.uid();
 insert into public.profile_interests(user_id,interest_id) select auth.uid(),distinct_ids.id from (select distinct unnest(p_interest_ids) id) distinct_ids;
end;
$$;
create function public.request_nickname_change(p_nickname text) returns void language plpgsql security definer set search_path='' as $$
declare old_name text;
begin
 if not private.is_active() then raise exception 'FORBIDDEN'; end if;
 if p_nickname is null or p_nickname !~ '^[가-힣A-Za-z0-9_]{2,20}$' then raise exception 'INVALID_NICKNAME'; end if;
 select nickname into old_name from public.profiles where id=auth.uid() for update;
 if lower(old_name)=lower(p_nickname) then raise exception 'SAME_NICKNAME'; end if;
 if exists(select 1 from public.profiles where nickname_normalized=lower(p_nickname)) then raise exception 'NICKNAME_TAKEN'; end if;
 insert into public.nickname_change_requests(user_id,proposed_nickname) values(auth.uid(),p_nickname);
end;
$$;
create function public.review_nickname_change(p_request_id uuid,p_approve boolean) returns void language plpgsql security definer set search_path='' as $$
declare request_row public.nickname_change_requests;
begin
 perform pg_advisory_xact_lock(7729019);
 if not private.is_admin() then raise exception 'FORBIDDEN'; end if;
 select * into request_row from public.nickname_change_requests where id=p_request_id for update;
 if request_row.id is null or request_row.status<>'pending' then raise exception 'REQUEST_NOT_PENDING'; end if;
 if p_approve is null then raise exception 'INVALID_DECISION'; end if;
 if p_approve then
  if exists(select 1 from public.profiles where nickname_normalized=lower(request_row.proposed_nickname) and id<>request_row.user_id) then raise exception 'NICKNAME_TAKEN'; end if;
  update public.profiles set nickname=request_row.proposed_nickname,updated_at=now() where id=request_row.user_id and membership_status='active';
  if not found then raise exception 'MEMBER_NOT_ACTIVE'; end if;
 end if;
 update public.nickname_change_requests set status=case when p_approve then 'approved' else 'rejected' end,reviewed_by=auth.uid(),reviewed_at=now() where id=request_row.id;
 insert into public.admin_actions(actor_id,action,target_type,target_id) values(auth.uid(),case when p_approve then 'nickname.approve' else 'nickname.reject' end,'nickname_change_request',request_row.id);
end;
$$;
revoke all on function public.update_my_profile(integer,text,text,text,text,text,text,uuid[]),public.request_nickname_change(text),public.review_nickname_change(uuid,boolean) from public,anon;
grant execute on function public.update_my_profile(integer,text,text,text,text,text,text,uuid[]),public.request_nickname_change(text),public.review_nickname_change(uuid,boolean) to authenticated;

-- Phase 4: common questions and one cumulative answer per member/question.
create table public.question_categories (
 id uuid primary key default gen_random_uuid(), name text not null unique check(char_length(name) between 1 and 60),
 sort_order integer not null default 0, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.questions (
 id uuid primary key default gen_random_uuid(), category_id uuid not null references public.question_categories(id),
 title text not null check(char_length(title) between 1 and 300),
 type text not null check(type in ('text','single_choice','balance_game')),
 sort_order integer not null default 0, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.question_options (
 id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade,
 label text not null check(char_length(label) between 1 and 200), sort_order integer not null,
 unique(question_id,sort_order)
);
create table public.answers (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 question_id uuid not null references public.questions(id),
 text_value text check(text_value is null or char_length(text_value) between 1 and 300),
 option_id uuid references public.question_options(id),
 hidden_at timestamptz, hidden_by uuid references public.profiles(id), deleted_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,question_id),
 check((text_value is null) <> (option_id is null))
);
create index answers_question_idx on public.answers(question_id);
alter table public.question_categories enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.answers enable row level security;
revoke all on public.question_categories,public.questions,public.question_options,public.answers from anon,authenticated;
grant select on public.question_categories,public.questions,public.question_options,public.answers to authenticated;
create policy categories_read on public.question_categories for select to authenticated using(private.is_admin() or (private.is_active() and is_active));
create policy questions_read on public.questions for select to authenticated using(private.is_admin() or (private.is_active() and is_active and exists(select 1 from public.question_categories c where c.id=category_id and c.is_active)));
create policy options_read on public.question_options for select to authenticated using(private.is_admin() or (private.is_active() and exists(select 1 from public.questions q join public.question_categories c on c.id=q.category_id where q.id=question_id and q.is_active and c.is_active)));
create policy answers_read on public.answers for select to authenticated using(
 private.is_admin() or (private.is_active() and hidden_at is null and deleted_at is null and
  exists(select 1 from public.profiles p where p.id=user_id and p.membership_status='active') and
  exists(select 1 from public.questions q join public.question_categories c on c.id=q.category_id where q.id=question_id and q.is_active and c.is_active))
);
create function public.create_question_category(p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare created_id uuid;
begin
 if not private.is_admin() then raise exception 'FORBIDDEN'; end if;
 if p_name is null or char_length(trim(p_name)) not between 1 and 60 then raise exception 'INVALID_CATEGORY'; end if;
 insert into public.question_categories(name) values(trim(p_name)) returning id into created_id;
 insert into public.admin_actions(actor_id,action,target_type,target_id) values(auth.uid(),'question_category.create','question_category',created_id);
 return created_id;
end;
$$;
create function public.create_question(p_category_id uuid,p_title text,p_type text,p_option_labels text[]) returns uuid language plpgsql security definer set search_path='' as $$
declare created_id uuid; options_count integer;
begin
 if not private.is_admin() then raise exception 'FORBIDDEN'; end if;
 if not exists(select 1 from public.question_categories where id=p_category_id and is_active) then raise exception 'INVALID_CATEGORY'; end if;
 if p_title is null or char_length(trim(p_title)) not between 1 and 300 or p_type not in ('text','single_choice','balance_game') then raise exception 'INVALID_QUESTION'; end if;
 options_count:=coalesce(array_length(p_option_labels,1),0);
 if (p_type='text' and options_count<>0) or (p_type='single_choice' and options_count<2) or (p_type='balance_game' and options_count<>2) then raise exception 'INVALID_OPTIONS'; end if;
 if exists(select 1 from unnest(p_option_labels) label where label is null or char_length(trim(label)) not between 1 and 200) then raise exception 'INVALID_OPTIONS'; end if;
 insert into public.questions(category_id,title,type) values(p_category_id,trim(p_title),p_type) returning id into created_id;
 insert into public.question_options(question_id,label,sort_order) select created_id,trim(label),ordinality::integer from unnest(p_option_labels) with ordinality as options(label,ordinality);
 insert into public.admin_actions(actor_id,action,target_type,target_id) values(auth.uid(),'question.create','question',created_id);
 return created_id;
end;
$$;
create function public.set_question_active(p_question_id uuid,p_active boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'FORBIDDEN'; end if;
 if p_active is null then raise exception 'INVALID_DECISION'; end if;
 update public.questions set is_active=p_active where id=p_question_id and is_active is distinct from p_active;
 if not found then raise exception 'QUESTION_NOT_FOUND_OR_UNCHANGED'; end if;
 insert into public.admin_actions(actor_id,action,target_type,target_id) values(auth.uid(),case when p_active then 'question.activate' else 'question.deactivate' end,'question',p_question_id);
end;
$$;
create function public.save_answer(p_question_id uuid,p_text_value text,p_option_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare question_row public.questions;
begin
 if not private.is_active() then raise exception 'FORBIDDEN'; end if;
 select * into question_row from public.questions where id=p_question_id and is_active and exists(select 1 from public.question_categories c where c.id=category_id and c.is_active);
 if question_row.id is null then raise exception 'QUESTION_NOT_ACTIVE'; end if;
 if question_row.type='text' then
  if p_option_id is not null or p_text_value is null or char_length(trim(p_text_value)) not between 1 and 300 then raise exception 'INVALID_ANSWER'; end if;
 else
  if p_text_value is not null or p_option_id is null or not exists(select 1 from public.question_options where id=p_option_id and question_id=p_question_id) then raise exception 'INVALID_ANSWER'; end if;
 end if;
 insert into public.answers(user_id,question_id,text_value,option_id) values(auth.uid(),p_question_id,case when question_row.type='text' then trim(p_text_value) else null end,p_option_id)
 on conflict(user_id,question_id) do update set text_value=excluded.text_value,option_id=excluded.option_id,deleted_at=null,updated_at=now()
 where public.answers.hidden_at is null;
 if not found then raise exception 'ANSWER_HIDDEN'; end if;
end;
$$;
create function public.delete_answer(p_question_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_active() then raise exception 'FORBIDDEN'; end if;
 update public.answers set deleted_at=now(),updated_at=now() where user_id=auth.uid() and question_id=p_question_id and deleted_at is null;
 if not found then raise exception 'ANSWER_NOT_FOUND'; end if;
end;
$$;
create function public.set_answer_hidden(p_answer_id uuid,p_hidden boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'FORBIDDEN'; end if;
 if p_hidden is null then raise exception 'INVALID_DECISION'; end if;
 update public.answers set hidden_at=case when p_hidden then now() else null end,hidden_by=case when p_hidden then auth.uid() else null end where id=p_answer_id;
 if not found then raise exception 'ANSWER_NOT_FOUND'; end if;
 insert into public.admin_actions(actor_id,action,target_type,target_id) values(auth.uid(),case when p_hidden then 'answer.hide' else 'answer.show' end,'answer',p_answer_id);
end;
$$;
revoke all on function public.create_question_category(text),public.create_question(uuid,text,text,text[]),public.set_question_active(uuid,boolean),public.save_answer(uuid,text,uuid),public.delete_answer(uuid),public.set_answer_hidden(uuid,boolean) from public,anon;
grant execute on function public.create_question_category(text),public.create_question(uuid,text,text,text[]),public.set_question_active(uuid,boolean),public.save_answer(uuid,text,uuid),public.delete_answer(uuid),public.set_answer_hidden(uuid,boolean) to authenticated;
commit;
