-- Supabase SQL Editor에서 프로젝트 소유자가 실행합니다.
-- 이 계정의 승인과 관리자 권한만 설정합니다. 다른 관리자/회원은 변경하지 않습니다.
begin;
do $$
declare
 target uuid := 'a3e38864-049a-43e4-a446-345580481c3b';
 profile public.profiles;
begin
 perform pg_advisory_xact_lock(7729019);
 select * into profile from public.profiles where id=target for update;
 if profile.id is null then raise exception 'ACCOUNT_NOT_FOUND'; end if;
 if profile.membership_status not in ('pending_approval','active') then raise exception 'REGISTRATION_NOT_READY'; end if;
 if profile.nickname is null or profile.birth_year is null or profile.region is null or profile.avatar_path is null then raise exception 'PROFILE_INCOMPLETE'; end if;
 if profile.membership_status='active' and exists(select 1 from public.user_roles where user_id=target and role='super_admin') then return; end if;
 update public.profiles set membership_status='active',joined_at=coalesce(joined_at,now()),updated_at=now() where id=target;
 update public.membership_requests set status='approved',reviewed_by=target,reviewed_at=now() where user_id=target and status='pending';
 insert into public.user_roles(user_id,role,assigned_by) values(target,'member',target),(target,'super_admin',target) on conflict(user_id,role) do nothing;
 insert into public.admin_actions(actor_id,action,target_type,target_id,metadata) values(target,'role.activate_admin','profile',target,'{"source":"project_owner_sql"}');
end $$;
commit;
select membership_status from public.profiles where id='a3e38864-049a-43e4-a446-345580481c3b';
