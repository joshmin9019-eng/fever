import {requireUser} from "@/lib/auth/session";
import {RegistrationForm} from "@/components/registration-form";
import {legalConfig} from "@/lib/auth/legal";
export default async function Page(){const {supabase,user}=await requireUser();const {data,error}=await supabase.from('membership_requests').select('reapply_allowed,rejection_reason').eq('user_id',user.id).order('requested_at',{ascending:false}).limit(1).maybeSingle();const legal=legalConfig();return <section className="auth-section"><h1>가입 반려 안내</h1><p>{error?'계정 상태를 확인하지 못했습니다.':data?.rejection_reason??'가입 신청을 확인해 주세요.'}</p>{data?.reapply_allowed?<><p>관리자가 재신청을 허용했습니다.</p><RegistrationForm termsUrl={legal.termsUrl} privacyUrl={legal.privacyUrl} available={legal.ready}/></>:<p>관리자가 재신청을 허용한 경우에만 다시 신청할 수 있습니다.</p>}</section>;}
