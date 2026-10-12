import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
// PostgreSQL engine with minimal Supabase auth/storage contract fixtures.
// This verifies SQL and RLS, not the live Supabase Auth/Storage services.
const db=new PGlite();
await db.exec(`
create role anon; create role authenticated;
create schema auth; create schema storage;
create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text,metadata jsonb);
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated;
grant select,insert,delete on storage.objects to authenticated;
create function storage.foldername(name text) returns text[] language sql immutable as $$select string_to_array(name,'/')$$;
`);
await db.exec(await readFile(new URL('../supabase/migrations/202610120001_membership.sql',import.meta.url),'utf8'));
const admin='00000000-0000-0000-0000-000000000001';
const a='00000000-0000-0000-0000-000000000002';
const b='00000000-0000-0000-0000-000000000003';
const unverified='00000000-0000-0000-0000-000000000004';
await db.query('insert into auth.users(id,email_confirmed_at) values($1,now()),($2,now()),($3,now()),($4,null)',[admin,a,b,unverified]);
await db.query("update public.profiles set membership_status='active' where id=$1",[admin]);
await db.query("insert into public.user_roles(user_id,role) values($1,'super_admin')",[admin]);
async function asUser(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');}
async function fails(sql,args=[]){await assert.rejects(()=>db.query(sql,args));}
async function upload(id){await db.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('avatars',$1,$2,'{\"mimetype\":\"image/png\",\"size\":100}')",[`${id}/photo.png`,id]);}
async function submit(id,nickname){await db.query("select public.submit_membership($1,1995,'서울',$2,'v1','v1')",[nickname,`${id}/photo.png`]);}
await asUser(a);
assert.equal((await db.query('select * from public.profiles')).rows.length,1);
await fails("update public.profiles set membership_status='active' where id=$1",[a]);
await fails("insert into public.user_roles(user_id,role) values($1,'super_admin')",[a]);
await fails("select public.submit_membership('회원가',1995,'서울','missing','v1','v1')");
await upload(a);await submit(a,'Fever');
await fails("select public.submit_membership('Fever',1995,'서울',$1,'v1','v1')",[`${a}/photo.png`]);
await db.query('delete from storage.objects where name=$1',[`${a}/photo.png`]);
assert.equal((await db.query('select * from storage.objects')).rows.length,1);
const requestA=(await db.query('select id from public.membership_requests')).rows[0].id;
await fails('select public.review_membership($1,true)',[requestA]);
await asUser(b);await upload(b);
await fails("select public.submit_membership('fever',1995,'서울',$1,'v1','v1')",[`${b}/photo.png`]);
await submit(b,'회원나');
const requestB=(await db.query('select id from public.membership_requests')).rows[0].id;
assert.equal((await db.query('select * from public.profiles where id=$1',[a])).rows.length,0);
assert.equal((await db.query('select * from storage.objects where name=$1',[`${a}/photo.png`])).rows.length,0);
await asUser(unverified);await upload(unverified);await fails("select public.submit_membership('미인증',1995,'서울',$1,'v1','v1')",[`${unverified}/photo.png`]);
await asUser(admin);
await db.query('select public.review_membership($1,true)',[requestA]);
await fails('select public.review_membership($1,true)',[requestA]);
await db.query("select public.review_membership($1,false,'가입 기준 확인')",[requestB]);
await asUser(b);await fails("select public.submit_membership('회원나',1995,'서울',$1,'v1','v1')",[`${b}/photo.png`]);
await asUser(admin);await db.query('select public.allow_reapplication($1)',[requestB]);
assert.equal((await db.query('select count(*)::int n from public.admin_actions')).rows[0].n,3);
await asUser(b);await submit(b,'회원나');
await asUser(a);
assert.equal((await db.query('select * from public.profiles where id=$1',[b])).rows.length,0);
assert.equal((await db.query('select * from public.profiles where id=$1',[admin])).rows.length,1);
assert.equal((await db.query('select * from public.admin_actions')).rows.length,0);
await db.exec('reset role');
await db.query("update public.profiles set membership_status='suspended' where id=$1",[a]);
await asUser(a);
assert.equal((await db.query('select * from public.profiles where id=$1',[admin])).rows.length,0);
assert.equal((await db.query('select private.is_active() allowed')).rows[0].allowed,false);
await db.exec('reset role');
await db.exec("delete from public.user_roles where role='super_admin'");
const bootstrap=(await readFile(new URL('../supabase/bootstrap-super-admin.sql',import.meta.url),'utf8')).replace('REPLACE_WITH_VERIFIED_USER_UUID',b);
await db.exec(bootstrap);
assert.equal((await db.query("select role from public.user_roles where user_id=$1 and role='super_admin'",[b])).rows.length,1);
await assert.rejects(()=>db.exec(bootstrap));
await db.exec('rollback; reset role; set role anon');await fails('select * from public.profiles');await fails('select public.review_membership($1,true)',[requestA]);
await db.close();
console.log('Database checks passed: migration, own-only pending access, immutable status/roles, photo/email prerequisites, case-insensitive nickname uniqueness, approval, duplicate review, rejection/reapplication, audit visibility, anonymous denial.');
