import Link from 'next/link';
import {requireMember} from '@/lib/auth/session';
import {genderClass,genderLabel} from '@/lib/member/display';
type DiscoveryGroup={title:string;category:string;answers:{id:string;userId:string;nickname:string;gender:string|null;text:string}[]};
export default async function Page(){
 const {supabase,user}=await requireMember();
 const {data,error}=await supabase.from('answers').select(
  'id,user_id,question_id,text_value,updated_at,questions!inner(id,title,is_active,question_categories(name)),profiles!inner(id,nickname,gender,membership_status),question_options(label)'
 ).neq('user_id',user.id).is('hidden_at',null).is('deleted_at',null)
  .eq('questions.is_active',true).eq('profiles.membership_status','active').order('updated_at',{ascending:false}).limit(100);
 if(error)return <section className="placeholder"><h1>대화 발견</h1><p role="alert">답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p></section>;
 const groups=new Map<string,DiscoveryGroup>();
 for(const row of data??[]){
  const question=Array.isArray(row.questions)?row.questions[0]:row.questions;
  const person=Array.isArray(row.profiles)?row.profiles[0]:row.profiles;
  const option=Array.isArray(row.question_options)?row.question_options[0]:row.question_options;
  if(!question||!person)continue;
  const category=Array.isArray(question.question_categories)?question.question_categories[0]:question.question_categories;
  const current:DiscoveryGroup=groups.get(question.id)??{title:question.title,category:category?.name??'질문',answers:[]};
  current.answers.push({id:row.id,userId:row.user_id,nickname:person.nickname??'회원',gender:person.gender,text:row.text_value??option?.label??''});
  groups.set(question.id,current);
 }
 return <section className="content-section discover-page"><span className="eyebrow dark">FIND A CONVERSATION</span><h1>대화 발견</h1><p>다른 회원의 답변에서 공통점과 마음이 가는 이야기를 찾아보세요.</p>
  {!groups.size&&<div className="notice">아직 다른 회원의 공개 답변이 없습니다. 먼저 질문에 답해 나의 이야기를 남겨 보세요. <Link className="text-link" href="/questions">질문 보기 →</Link></div>}
  <div className="discovery-list">{[...groups.entries()].map(([id,group])=><article className="discovery-card" key={id}><small>{group.category}</small><h2><Link href={`/questions/${id}`}>{group.title}</Link></h2><div className="discovery-answers">{group.answers.slice(0,2).map(answer=><div className="discovery-answer" key={answer.id}><Link href={`/members/${answer.userId}`} className="discovery-person"><span className={`gender-badge ${genderClass(answer.gender)}`}>{genderLabel(answer.gender)}</span>{answer.nickname}</Link><p>{answer.text}</p></div>)}</div><Link className="text-link" href={`/questions/${id}`}>이 질문의 답변 더 보기 →</Link></article>)}</div>
 </section>;
}
