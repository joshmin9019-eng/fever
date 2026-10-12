-- Read-only diagnostic. Replace the UUID with the one shown on FEVER /account/status.
select
 u.id as login_uid,
 u.email as login_email,
 p.membership_status,
 p.nickname,
 coalesce((select array_agg(r.role order by r.role) from public.user_roles r where r.user_id=u.id),array[]::text[]) as roles,
 (select exists(select 1 from public.user_roles where role='super_admin')) as any_super_admin_exists,
 (select mr.status from public.membership_requests mr where mr.user_id=u.id order by mr.requested_at desc limit 1) as latest_request
from auth.users u
left join public.profiles p on p.id=u.id
where u.id='REPLACE_WITH_LOGIN_UID';
