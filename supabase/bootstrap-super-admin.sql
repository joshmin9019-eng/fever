-- Supabase SQL editor에서 운영자가 최초 1회 실행합니다.
-- 이메일 인증 및 사진/프로필 가입 신청을 완료한 신뢰할 수 있는 본인 UUID로 교체하세요.
-- 웹에서 관리자 역할을 자체 부여하는 API는 제공하지 않습니다.
begin;
do $$
declare target uuid := 'bc103688-a50c-4ae1-a1a7-82a07ca4971a'; req uuid;
begin
 perform pg_advisory_xact_lock(7729019);
 if exists(select 1 from public.user_roles where role='super_admin') then raise exception 'SUPER_ADMIN_ALREADY_EXISTS'; end if;
 if not exists(select 1 from auth.users where id=target and email_confirmed_at is not null) then raise exception 'EMAIL_NOT_VERIFIED'; end if;
 perform 1 from public.profiles where id=target and membership_status='pending_approval' and avatar_path is not null for update;
 if not found then raise exception 'REGISTRATION_INCOMPLETE'; end if;
 select id into req from public.membership_requests where user_id=target and status='pending' for update;
 if req is null then raise exception 'REQUEST_MISSING'; end if;
 update public.profiles set membership_status='active',joined_at=now(),updated_at=now() where id=target;
 update public.membership_requests set status='approved',reviewed_by=target,reviewed_at=now() where id=req;
 insert into public.user_roles(user_id,role,assigned_by) values(target,'member',target),(target,'super_admin',target);
 insert into public.admin_actions(actor_id,action,target_type,target_id) values(target,'role.bootstrap_super_admin','profile',target);
end $$;
commit;
