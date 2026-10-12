import {requireMember} from '@/lib/auth/session';
import {notFound} from 'next/navigation';
import Link from 'next/link';
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const {supabase}=await requireMember();
 const [{data:member},{data:answers,error}]=await Promise.all([
  supabase.from('profiles').select('nickname').eq('id',id).eq('membership_status','active').maybeSingle(),
  supabase.from('answers').select('id,text_value,questions(id,title,type,question_categories(name)),question_options(label)').eq('user_id',id).is('hidden_at',null).is('deleted_at',null).order('updated_at',{ascending:false})
 ]);
 if(!member||error)notFound();
 return <section className="content-section"><Link className="text-link" href={`/members/${id}`}>← {member.nickname} 프로필</Link><span className="eyebrow dark">MEMBER STORIES</span><h1>{member.nickname}님의 답변</h1><p>질문별로 쌓인 이야기를 살펴보세요.</p>{!answers?.length&&<div className="notice">아직 공개한 답변이 없습니다.</div>}
  <div className="answer-list">{answers?.map(answer=>{const question=Array.isArray(answer.questions)?answer.questions[0]:answer.questions;const option=Array.isArray(answer.question_options)?answer.question_options[0]:answer.question_options;const category=question?(Array.isArray(question.question_categories)?question.question_categories[0]:question.question_categories):null;return question?<article className="answer-card" key={answer.id}><small>{category?.name}</small><h2>{question.title}</h2><p>{answer.text_value??option?.label}</p></article>:null})}</div>
 </section>;
}
