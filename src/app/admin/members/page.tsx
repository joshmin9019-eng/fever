import Image from "next/image";
import {requireMember} from "@/lib/auth/session";
import {ReviewForm} from "@/components/review-form";
export default async function Page(){
 const {supabase}=await requireMember("admin");
 const {data,error}=await supabase.from("membership_requests").select("id,status,requested_at,reapply_allowed,profiles!membership_requests_user_id_fkey(nickname,birth_year,region,avatar_path)").in('status',['pending','rejected']).order('requested_at',{ascending:true});
 if(error)return <section className="placeholder"><h1>회원 관리</h1><p role="alert">신청 목록을 불러오지 못했습니다. DB 설정을 확인해 주세요.</p></section>;
 return <section className="admin-section"><span className="eyebrow dark">MEMBERSHIP REQUESTS</span><h1>회원 가입 관리</h1><p>가입 신청을 확인하고 승인 또는 반려해 주세요.</p>{!data?.length&&<div className="notice">처리할 가입 신청이 없습니다.</div>}{await Promise.all((data??[]).map(async request=>{
 const profile=Array.isArray(request.profiles)?request.profiles[0]:request.profiles;
 const {data:photo}=profile?.avatar_path?await supabase.storage.from('avatars').createSignedUrl(profile.avatar_path,60):{data:null};
 return <article className="request-card" key={request.id}>{photo?.signedUrl&&<Image unoptimized src={photo.signedUrl} alt="신청자 프로필 사진" width={72} height={72}/>}<h2>{profile?.nickname??'미완료 신청'}</h2><p>{profile?.birth_year}년생 · {profile?.region}</p><p>신청일: {new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeZone:'Asia/Seoul'}).format(new Date(request.requested_at))}</p>{request.status==='pending'?<ReviewForm id={request.id}/>:request.reapply_allowed?<p>반려 · 재신청 허용됨</p>:<ReviewForm id={request.id} rejected/>}</article>;
 }))}</section>;
}
