import {redirect} from "next/navigation";
import {requireUser} from "@/lib/auth/session";
import {logout} from "@/app/login/actions";
import {RegistrationForm} from "@/components/registration-form";
import {legalConfig} from "@/lib/auth/legal";
export default async function Page(){
 const {supabase,user}=await requireUser();
 const {data:profile,error}=await supabase.from("profiles").select("membership_status").eq("id",user.id).maybeSingle();
 if(error)redirect("/auth/error?reason=database");
 if(profile?.membership_status==='active')redirect('/profile');
 if(profile?.membership_status==='rejected')redirect('/account/rejected');
 if(['suspended','deleted'].includes(profile?.membership_status))redirect('/account/suspended');
 const incomplete=profile?.membership_status==='pending_email';const legal=legalConfig();
 return <section className="auth-section"><span className="eyebrow dark">YOUR MEMBERSHIP</span><h1>{!user.email_confirmed_at?"이메일을 확인해 주세요":incomplete?"나를 소개해 주세요":"가입 승인 대기"}</h1><p>{!user.email_confirmed_at?"이메일로 전송된 인증 링크를 확인해 주세요.":incomplete?"사진과 기본 정보를 입력하면 가입 신청이 완료됩니다.":"관리자의 승인을 기다리고 있습니다. 승인 전에는 회원 전용 정보를 열람할 수 없습니다."}</p>{incomplete&&user.email_confirmed_at&&<RegistrationForm termsUrl={legal.termsUrl} privacyUrl={legal.privacyUrl} available={legal.ready}/>}<form action={logout}><button className="button green" style={{marginTop:24}}>로그아웃</button></form></section>;
}
