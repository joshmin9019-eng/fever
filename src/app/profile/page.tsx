import {requireMember} from "@/lib/auth/session";
import {logout} from "@/app/login/actions";
import {genderClass,genderLabel,ageDecade} from "@/lib/member/display";
import Link from "next/link";
import Image from "next/image";
import {AnswerPreview} from "@/components/answer-preview";
export default async function Page(){
 const {supabase,user}=await requireMember();
 const [{data:profile,error},{data:roles},{data:interestRows},{data:answerRows}]=await Promise.all([
  supabase.from('profiles').select('nickname,birth_year,region,gender,job,mbti,bio,avatar_path').eq('id',user.id).single(),
  supabase.from('user_roles').select('role').eq('user_id',user.id),
  supabase.from('profile_interests').select('interests(label)').eq('user_id',user.id),
  supabase.from('answers').select('id,text_value,questions(title),question_options(label)').eq('user_id',user.id).is('hidden_at',null).is('deleted_at',null).order('updated_at',{ascending:false}).limit(3)
 ]);
 if(error||!profile)return <section className="placeholder"><h1>나의 FEVER</h1><p role="alert">프로필을 불러오지 못했습니다.</p></section>;
 const {data:photo}=profile.avatar_path?await supabase.storage.from('avatars').createSignedUrl(profile.avatar_path,60):{data:null};
 return <section className="content-section"><span className="eyebrow dark">MY FEVER</span><h1>나의 프로필</h1><article className={`member-detail ${genderClass(profile.gender)}`}>
  {photo?.signedUrl&&<Image unoptimized className="profile-photo" src={photo.signedUrl} alt="내 프로필 사진" width={112} height={112}/>}
  <div><h2>{profile.nickname}</h2><span className={`gender-badge ${genderClass(profile.gender)}`}>{genderLabel(profile.gender)}</span><p>{ageDecade(profile.birth_year)} · {profile.region}{profile.job?` · ${profile.job}`:''}</p>{profile.mbti&&<p>MBTI {profile.mbti}</p>}</div>
  {profile.bio&&<p className="member-bio">{profile.bio}</p>}
  {!!interestRows?.length&&<div className="tag-list">{interestRows.map((row,index)=><span key={index}>{(Array.isArray(row.interests)?row.interests[0]:row.interests)?.label}</span>)}</div>}
 </article><AnswerPreview answers={answerRows??[]} href={`/members/${user.id}/answers`} own/><div className="page-actions"><Link className="button green" href="/profile/edit">프로필 수정</Link><Link className="button soft" href="/questions">질문 답변하기</Link>{roles?.some(item=>['admin','super_admin'].includes(item.role))&&<Link className="button soft" href="/admin">관리자 화면</Link>}</div><form action={logout}><button className="text-link">로그아웃</button></form></section>;
}
