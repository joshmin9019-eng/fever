-- Run in Supabase SQL editor/migrations. No secret keys required by the application.
begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 nickname text, nickname_normalized text generated always as (lower(nickname)) stored unique,
 birth_year integer, region text, avatar_path text,
 membership_status text not null default 'pending_email' check (membership_status in ('pending_email','pending_approval','active','rejected','suspended','withdrawal_requested','deleted')),
 joined_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(nickname is null or nickname ~ '^[가-힣A-Za-z0-9_]{2,20}$'),
 check(birth_year is null or birth_year between 1 and 9999),
 check(region is null or char_length(region) between 1 and 100)
);
create table public.user_roles (
 user_id uuid not null references public.profiles(id), role text not null check(role in ('member','admin','super_admin')),
 assigned_by uuid references public.profiles(id), assigned_at timestamptz not null default now(), primary key(user_id,role)
);
create table public.membership_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 requested_at timestamptz not null default now(), reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
 rejection_reason text, reapply_allowed boolean not null default false,
 terms_version text not null, privacy_version text not null, consented_at timestamptz not null default now()
);
create unique index one_pending_request on public.membership_requests(user_id) where status='pending';
create table public.admin_actions (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.profiles(id), action text not null,
 target_type text not null, target_id uuid not null, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create function private.is_active() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=auth.uid() and p.membership_status='active' and u.email_confirmed_at is not null)
$$;
create function private.has_role(required text) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_active() and exists(select 1 from public.user_roles where user_id=auth.uid() and role=required)
$$;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select private.has_role('admin') or private.has_role('super_admin')
$$;
revoke all on function private.is_active(), private.has_role(text), private.is_admin() from public;
grant execute on function private.is_active(), private.has_role(text), private.is_admin() to authenticated;
create function private.new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id) values(new.id); return new; end;
$$;
create trigger fever_new_user after insert on auth.users for each row execute function private.new_user();
-- Backfill auth accounts that predate this migration, without trusting user metadata for roles/status.
insert into public.profiles(id) select id from auth.users on conflict(id) do nothing;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.membership_requests enable row level security;
alter table public.admin_actions enable row level security;
revoke all on public.profiles,public.user_roles,public.membership_requests,public.admin_actions from anon,authenticated;
grant select on public.profiles,public.user_roles,public.membership_requests,public.admin_actions to authenticated;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or private.is_admin() or (private.is_active() and membership_status='active'));
create policy roles_read on public.user_roles for select to authenticated using(user_id=auth.uid() or private.is_admin());
create policy requests_read on public.membership_requests for select to authenticated using(user_id=auth.uid() or private.is_admin());
create policy audit_read on public.admin_actions for select to authenticated using(private.has_role('super_admin'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('avatars','avatars',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy avatar_insert on storage.objects for insert to authenticated with check(
 bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.profiles where id=auth.uid() and membership_status in ('pending_email','rejected'))
);
create policy avatar_read on storage.objects for select to authenticated using(
 bucket_id='avatars' and ((storage.foldername(name))[1]=auth.uid()::text or private.is_admin()
 or (private.is_active() and exists(select 1 from public.profiles where avatar_path=name and membership_status='active')))
);
create policy avatar_cleanup on storage.objects for delete to authenticated using(
 bucket_id='avatars' and owner_id=auth.uid()::text and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.profiles where id=auth.uid() and avatar_path is distinct from name)
);
create function public.submit_membership(p_nickname text,p_birth_year integer,p_region text,p_avatar_path text,p_terms_version text,p_privacy_version text)
returns void language plpgsql security definer set search_path='' as $$
declare p public.profiles; last_request public.membership_requests;
begin
 select * into p from public.profiles where id=auth.uid() for update;
 if p.id is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'EMAIL_VERIFICATION_REQUIRED'; end if;
 if p.membership_status not in ('pending_email','rejected') then raise exception 'INVALID_STATE'; end if;
 if p.membership_status='rejected' then
  select * into last_request from public.membership_requests where user_id=p.id order by requested_at desc limit 1;
  if not coalesce(last_request.reapply_allowed,false) then raise exception 'REAPPLICATION_NOT_ALLOWED'; end if;
 end if;
 if p_nickname is null or p_nickname !~ '^[가-힣A-Za-z0-9_]{2,20}$' then raise exception 'INVALID_NICKNAME'; end if;
 if p_birth_year is null or p_birth_year<1 or p_birth_year>extract(year from now() at time zone 'Asia/Seoul') then raise exception 'INVALID_BIRTH_YEAR'; end if;
 if p_region is null or char_length(trim(p_region)) not between 1 and 100 then raise exception 'INVALID_REGION'; end if;
 if p_terms_version is null or p_privacy_version is null or length(p_terms_version)=0 or length(p_privacy_version)=0 then raise exception 'CONSENT_REQUIRED'; end if;
 if not exists(select 1 from storage.objects where bucket_id='avatars' and name=p_avatar_path and owner_id=auth.uid()::text and (storage.foldername(name))[1]=auth.uid()::text
 and (metadata->>'mimetype') in ('image/jpeg','image/png','image/webp') and (metadata->>'size')::bigint between 1 and 5242880) then raise exception 'AVATAR_REQUIRED'; end if;
 update public.profiles set nickname=p_nickname,birth_year=p_birth_year,region=trim(p_region),avatar_path=p_avatar_path,membership_status='pending_approval',updated_at=now() where id=p.id;
 insert into public.membership_requests(user_id,terms_version,privacy_version) values(p.id,p_terms_version,p_privacy_version);
end;
$$;
create function public.review_membership(p_request_id uuid,p_approve boolean,p_reason text default null)
returns void language plpgsql security definer set search_path='' as $$
declare req public.membership_requests;
begin
 -- Serialize role checks and administrator transitions to avoid stale permissions.
 perform pg_advisory_xact_lock(7729019);
 if not private.is_admin() then raise exception 'FORBIDDEN'; end if;
 select * into req from public.membership_requests where id=p_request_id for update;
 if req.id is null or req.status<>'pending' then raise exception 'REQUEST_NOT_PENDING'; end if;
 perform 1 from public.profiles where id=req.user_id and membership_status='pending_approval' and avatar_path is not null for update;
 if not found then raise exception 'INCOMPLETE_REGISTRATION'; end if;
 if p_approve is null then raise exception 'INVALID_DECISION'; end if;
 update public.profiles set membership_status=case when p_approve then 'active' else 'rejected' end, joined_at=case when p_approve then now() else joined_at end,updated_at=now() where id=req.user_id;
 update public.membership_requests set status=case when p_approve then 'approved' else 'rejected' end,reviewed_by=auth.uid(),reviewed_at=now(),rejection_reason=case when p_approve then null else left(p_reason,500) end where id=req.id;
 if p_approve then insert into public.user_roles(user_id,role,assigned_by) values(req.user_id,'member',auth.uid()) on conflict do nothing; end if;
 insert into public.admin_actions(actor_id,action,target_type,target_id) values(auth.uid(),case when p_approve then 'membership.approve' else 'membership.reject' end,'membership_request',req.id);
end;
$$;
create function public.allow_reapplication(p_request_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(7729019);
 if not private.is_admin() then raise exception 'FORBIDDEN'; end if;
 update public.membership_requests set reapply_allowed=true where id=p_request_id and status='rejected';
 if not found then raise exception 'INVALID_REQUEST'; end if;
 insert into public.admin_actions(actor_id,action,target_type,target_id) values(auth.uid(),'membership.allow_reapplication','membership_request',p_request_id);
end;
$$;
revoke all on function public.submit_membership(text,integer,text,text,text,text),public.review_membership(uuid,boolean,text),public.allow_reapplication(uuid) from public,anon;
grant execute on function public.submit_membership(text,integer,text,text,text,text),public.review_membership(uuid,boolean,text),public.allow_reapplication(uuid) to authenticated;
commit;
