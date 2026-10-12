import {requireMember} from '@/lib/auth/session';
import {notFound} from 'next/navigation';
import {AnswerForm} from '@/components/answer-form';
import Link from 'next/link';
import {genderClass} from '@/lib/member/display';
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const {supabase,user}=await requireMember();
 const [{data:question,error},{data:answer},{data:others, error:othersError}]=await Promise.all([
  supabase.from('questions').select('id,title,type,question_categories(name),question_options(id,label,sort_order)').eq('id',id).eq('is_active',true).maybeSingle(),
  supabase.from('answers').select('text_value,option_id').eq('user_id',user.id).eq('question_id',id).is('deleted_at',null).is('hidden_at',null).maybeSingle(),
  supabase.from('answers').select('id,user_id,text_value,profiles!inner(nickname,gender,membership_status),question_options(label)').eq('question_id',id).neq('user_id',user.id).is('deleted_at',null).is('hidden_at',null).eq('profiles.membership_status','active').order('updated_at',{ascending:false}).limit(100)
 ]);
 if(error||!question)notFound();
 const category=Array.isArray(question.question_categories)?question.question_categories[0]:question.question_categories;
 return <section className="content-section question-detail"><Link className="text-link" href="/questions">← 질문 목록</Link><span className="eyebrow dark">{category?.name??'질문'}</span><h1>{question.title}</h1><p>{question.type==='text'?'주관식 · 최대 300자':question.type==='balance_game'?'밸런스게임 · 둘 중 하나':'객관식 · 하나만 선택'}</p><AnswerForm questionId={id} type={question.type} options={(question.question_options??[]).sort((a,b)=>a.sort_order-b.sort_order)} answer={answer}/>
  <section className="others-answers"><div className="section-heading"><h2>다른 회원은 이렇게 답했어요</h2><Link className="text-link" href="/discover">대화 발견 →</Link></div>{othersError?<p role="alert">답변을 불러오지 못했습니다.</p>:!others?.length?<p className="notice">아직 다른 회원의 공개 답변이 없습니다.</p>:<div className="answer-list">{others.map(row=>{const person=Array.isArray(row.profiles)?row.profiles[0]:row.profiles;const option=Array.isArray(row.question_options)?row.question_options[0]:row.question_options;return <article className="answer-card" key={row.id}><Link className={`discovery-person ${genderClass(person?.gender)}`} href={`/members/${row.user_id}`}>{person?.nickname??'회원'} →</Link><p>{row.text_value??option?.label}</p></article>})}</div>}</section>
 </section>;
}
