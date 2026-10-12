import { requireMember } from "@/lib/auth/session";
import { genderClass, ageDecade } from "@/lib/member/display";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {AnswerPreview} from "@/components/answer-preview";
import {IdealTypeDisplay} from "@/components/ideal-type-display";
export default async function Page({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const {supabase,user}=await requireMember();
 const [{data:profile,error},{data:interestRows},{data:answerRows},{data:questionRows},{data:idealRows},{data:selfRows},{data:myIdealRows},{data:mySelfRows},{data:myInterestRows}]=await Promise.all([
  supabase.from('profiles').select('nickname,birth_year,region,gender,job,mbti,bio,avatar_path').eq('id',id).eq('membership_status','active').maybeSingle(),
  supabase.from('profile_interests').select('interests(label)').eq('user_id',id),
  supabase.from('answers').select('id,question_id,text_value,questions(title),question_options(label)').eq('user_id',id).is('hidden_at',null).is('deleted_at',null).order('updated_at',{ascending:false}).limit(3),
  supabase.from('answers').select('question_id,questions(title)').eq('user_id',id).is('hidden_at',null).is('deleted_at',null).order('updated_at',{ascending:false}).limit(100),
  supabase.from('profile_ideal_types').select('option_id,ideal_type_options(category,label,sort_order)').eq('user_id',id),
  supabase.from('profile_self_types').select('option_id,ideal_type_options(category,label,sort_order)').eq('user_id',id),
  supabase.from('profile_ideal_types').select('option_id').eq('user_id',user.id),
  supabase.from('profile_self_types').select('option_id').eq('user_id',user.id),
  supabase.from('profile_interests').select('interests(label)').eq('user_id',user.id)
 ]);
 if(error||!profile)notFound();
 const {data:photo}=profile.avatar_path?await supabase.storage.from('avatars').createSignedUrl(profile.avatar_path,60):{data:null};
 const myIdeal=new Set((myIdealRows??[]).map(row=>row.option_id));
 const mySelf=new Set((mySelfRows??[]).map(row=>row.option_id));
 const forward=(selfRows??[]).filter(row=>myIdeal.has(row.option_id)).flatMap(row=>Array.isArray(row.ideal_type_options)?row.ideal_type_options:row.ideal_type_options?[row.ideal_type_options]:[]).map(option=>option.label);
 const reverse=(idealRows??[]).filter(row=>mySelf.has(row.option_id)).flatMap(row=>Array.isArray(row.ideal_type_options)?row.ideal_type_options:row.ideal_type_options?[row.ideal_type_options]:[]).map(option=>option.label);
 const ownInterests=new Set((myInterestRows??[]).flatMap(row=>Array.isArray(row.interests)?row.interests:row.interests?[row.interests]:[]).map(item=>item.label));
 const commonInterests=[...new Set((interestRows??[]).flatMap(row=>Array.isArray(row.interests)?row.interests:row.interests?[row.interests]:[]).map(item=>item.label))].filter(label=>ownInterests.has(label));
 const {data:myAnswers}=questionRows?.length?await supabase.from('answers').select('question_id').eq('user_id',user.id).in('question_id',questionRows.map(row=>row.question_id)).is('hidden_at',null).is('deleted_at',null):{data:[]};
 const ownAnswerIds=new Set((myAnswers??[]).map(row=>row.question_id));
 const conversation=(questionRows??[]).find(row=>ownAnswerIds.has(row.question_id));
 const conversationTitle=conversation?(Array.isArray(conversation.questions)?conversation.questions[0]:conversation.questions)?.title:null;
 return <section className="content-section"><Link className="text-link" href="/members">← 회원 목록</Link><article className={`member-detail ${genderClass(profile.gender)}`}>
  {photo?.signedUrl&&<Image unoptimized className="profile-photo" src={photo.signedUrl} alt={`${profile.nickname} 프로필 사진`} width={112} height={112}/>}
  <div><h1 className={`member-name-ring ${genderClass(profile.gender)}`}>{profile.nickname}</h1><span className="member-mbti-badge">{profile.mbti?`MBTI ${profile.mbti}`:'MBTI 미설정'}</span><p>{ageDecade(profile.birth_year)} · {profile.region}{profile.job?` · ${profile.job}`:''}</p></div>
  {profile.bio&&<p className="member-bio">{profile.bio}</p>}{!!interestRows?.length&&<div className="tag-list">{interestRows.map((row,index)=><span key={index}>{(Array.isArray(row.interests)?row.interests[0]:row.interests)?.label}</span>)}</div>}
 </article>{id!==user.id&&<section className="connection-panel"><span className="eyebrow dark">FIND A CONNECTION</span><h2>함께 이야기할 거리</h2><p>서로 선택한 취향과 공개 답변에서 공통점을 찾아보세요.</p><div className="connection-grid"><div><strong>내가 좋아하는 스타일 ↔ {profile.nickname}님의 스타일</strong><p>{forward.length?forward.join(' · '):'아직 겹치는 선택이 없어요.'}</p></div><div><strong>{profile.nickname}님이 좋아하는 스타일 ↔ 내 스타일</strong><p>{reverse.length?reverse.join(' · '):'아직 겹치는 선택이 없어요.'}</p></div></div>{forward.length>0&&reverse.length>0&&<p className="connection-mutual">서로의 취향이 통해요</p>}{commonInterests.length>0&&<p>함께 고른 관심사: {commonInterests.join(' · ')}</p>}{conversation&&conversationTitle&&<Link className="text-link" href={`/questions/${conversation.question_id}`}>둘 다 답한 질문: {conversationTitle} →</Link>}</section>}<IdealTypeDisplay kind="self" items={(selfRows??[]).flatMap(row=>Array.isArray(row.ideal_type_options)?row.ideal_type_options:row.ideal_type_options?[row.ideal_type_options]:[])}/><IdealTypeDisplay items={(idealRows??[]).flatMap(row=>Array.isArray(row.ideal_type_options)?row.ideal_type_options:row.ideal_type_options?[row.ideal_type_options]:[])}/><AnswerPreview answers={answerRows??[]} href={`/members/${id}/answers`}/></section>;
}
