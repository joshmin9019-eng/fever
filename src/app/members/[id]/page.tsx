import { requireMember } from "@/lib/auth/session";
import { genderClass, genderLabel, ageDecade } from "@/lib/member/display";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {AnswerPreview} from "@/components/answer-preview";
import {IdealTypeDisplay} from "@/components/ideal-type-display";
export default async function Page({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const {supabase}=await requireMember();
 const [{data:profile,error},{data:interestRows},{data:answerRows},{data:idealRows}]=await Promise.all([
  supabase.from('profiles').select('nickname,birth_year,region,gender,job,mbti,bio,avatar_path').eq('id',id).eq('membership_status','active').maybeSingle(),
  supabase.from('profile_interests').select('interests(label)').eq('user_id',id),
  supabase.from('answers').select('id,text_value,questions(title),question_options(label)').eq('user_id',id).is('hidden_at',null).is('deleted_at',null).order('updated_at',{ascending:false}).limit(3),
  supabase.from('profile_ideal_types').select('ideal_type_options(category,label,sort_order)').eq('user_id',id)
 ]);
 if(error||!profile)notFound();
 const {data:photo}=profile.avatar_path?await supabase.storage.from('avatars').createSignedUrl(profile.avatar_path,60):{data:null};
 return <section className="content-section"><Link className="text-link" href="/members">← 회원 목록</Link><article className={`member-detail ${genderClass(profile.gender)}`}>
  {photo?.signedUrl&&<Image unoptimized className="profile-photo" src={photo.signedUrl} alt={`${profile.nickname} 프로필 사진`} width={112} height={112}/>}
  <div><h1>{profile.nickname}</h1><span className={`gender-badge ${genderClass(profile.gender)}`}>{genderLabel(profile.gender)}</span><p>{ageDecade(profile.birth_year)} · {profile.region}{profile.job?` · ${profile.job}`:''}</p>{profile.mbti&&<p>MBTI {profile.mbti}</p>}</div>
  {profile.bio&&<p className="member-bio">{profile.bio}</p>}{!!interestRows?.length&&<div className="tag-list">{interestRows.map((row,index)=><span key={index}>{(Array.isArray(row.interests)?row.interests[0]:row.interests)?.label}</span>)}</div>}
 </article><IdealTypeDisplay items={(idealRows??[]).flatMap(row=>Array.isArray(row.ideal_type_options)?row.ideal_type_options:row.ideal_type_options?[row.ideal_type_options]:[])}/><AnswerPreview answers={answerRows??[]} href={`/members/${id}/answers`}/></section>;
}
