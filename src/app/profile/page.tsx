import {requireMember} from "@/lib/auth/session";
import {logout} from "@/app/login/actions";
import Link from "next/link";
export default async function Page(){
 const {supabase,user}=await requireMember();
 const {data:profile,error}=await supabase.from('profiles').select('nickname').eq('id',user.id).single();
 const {data:roles}=await supabase.from('user_roles').select('role').eq('user_id',user.id);
 return <section className="placeholder"><span className="eyebrow dark">MY FEVER</span><h1>{error?'나의 FEVER':`${profile.nickname}님, 반가워요`}</h1><p>승인된 회원으로 로그인했습니다.<br/>프로필 편집과 질문 답변 기능은 다음 단계에서 만나요.</p>{roles?.some(item=>['admin','super_admin'].includes(item.role))&&<Link className="button green" href="/admin">관리자 대시보드</Link>}<form action={logout}><button className="button green">로그아웃</button></form></section>;
}
