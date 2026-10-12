import { requireMember } from "@/lib/auth/session";
import { ProfileEditForms } from "@/components/profile-edit-forms";
export default async function Page() {
 const { supabase, user } = await requireMember();
 const [{data: profile,error}, {data: interests}, {data: selected}, {data: requests}] = await Promise.all([
  supabase.from("profiles").select("nickname,birth_year,region,gender,job,mbti,bio").eq("id",user.id).single(),
  supabase.from("interests").select("id,label").eq("is_active",true).order("sort_order"),
  supabase.from("profile_interests").select("interest_id").eq("user_id",user.id),
  supabase.from("nickname_change_requests").select("proposed_nickname").eq("user_id",user.id).eq("status","pending").limit(1)
 ]);
 if(error||!profile)return <section className="placeholder"><h1>프로필 수정</h1><p role="alert">정보를 불러오지 못했습니다. 새 데이터베이스 설정을 확인해 주세요.</p></section>;
 return <section className="content-section"><span className="eyebrow dark">MY PROFILE</span><h1>프로필 설정</h1><p>수정한 정보는 승인된 회원에게 표시됩니다.</p><ProfileEditForms profile={profile} interests={interests??[]} selected={(selected??[]).map(item=>item.interest_id)} pendingName={requests?.[0]?.proposed_nickname}/></section>;
}
