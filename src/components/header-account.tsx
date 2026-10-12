import {FeedbackLink} from './feedback-link';
import {createClient} from '@/lib/supabase/server';
import {isSupabaseConfigured} from '@/lib/supabase/config';
export async function HeaderAccount(){
 if(!isSupabaseConfigured())return <FeedbackLink className="login-link" href="/login">로그인 ↗</FeedbackLink>;
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 return <FeedbackLink className="login-link" href={user?'/profile':'/login'}>{user?'내 프로필 ↗':'로그인 ↗'}</FeedbackLink>;
}
