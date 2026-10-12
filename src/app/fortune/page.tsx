import Link from 'next/link';
import {requireMember} from '@/lib/auth/session';
import {FortunePanel} from '@/components/fortune-panel';
import {koreaToday} from '@/lib/questions/daily';
export default async function Page({searchParams}:{searchParams:Promise<{error?:string;saved?:string;deleted?:string}>}){
 const {supabase,user}=await requireMember();
 const [{data:profile},{data:birthdate,error:birthdateError},params]=await Promise.all([
  supabase.from('profiles').select('birth_year').eq('id',user.id).single(),
  supabase.from('profile_birthdates').select('birth_month,birth_day').eq('user_id',user.id).maybeSingle(),
  searchParams
 ]);
 return <div className="content-section"><Link className="text-link" href="/">← 홈으로</Link>{birthdateError?<p role="alert" className="notice">운세 저장 기능을 준비 중입니다. 데이터베이스 설정을 확인해 주세요.</p>:<FortunePanel today={koreaToday()} year={profile?.birth_year??0} month={birthdate?.birth_month??null} day={birthdate?.birth_day??null} saved={params.saved==='1'} error={params.error??null} deleted={params.deleted==='1'}/>}</div>;
}
