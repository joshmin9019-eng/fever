import Link from 'next/link';
import {createClient} from '@/lib/supabase/server';
import {isSupabaseConfigured} from '@/lib/supabase/config';
export async function HeaderAccount(){
 if(!isSupabaseConfigured())return <Link className="login-link" href="/login">로그인 ↗</Link>;
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 return <Link className="login-link" href={user?'/profile':'/login'}>{user?'내 프로필 ↗':'로그인 ↗'}</Link>;
}
