import {requireMember} from '@/lib/auth/session';
import {notFound} from 'next/navigation';
import {AnswerForm} from '@/components/answer-form';
import Link from 'next/link';
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const {supabase,user}=await requireMember();
 const [{data:question,error},{data:answer}]=await Promise.all([
  supabase.from('questions').select('id,title,type,question_categories(name),question_options(id,label,sort_order)').eq('id',id).eq('is_active',true).maybeSingle(),
  supabase.from('answers').select('text_value,option_id').eq('user_id',user.id).eq('question_id',id).is('deleted_at',null).is('hidden_at',null).maybeSingle()
 ]);
 if(error||!question)notFound();
 const category=Array.isArray(question.question_categories)?question.question_categories[0]:question.question_categories;
 return <section className="content-section question-detail"><Link className="text-link" href="/questions">← 질문 목록</Link><span className="eyebrow dark">{category?.name??'질문'}</span><h1>{question.title}</h1><p>{question.type==='text'?'주관식 · 최대 300자':question.type==='balance_game'?'밸런스게임 · 둘 중 하나':'객관식 · 하나만 선택'}</p><AnswerForm questionId={id} type={question.type} options={(question.question_options??[]).sort((a,b)=>a.sort_order-b.sort_order)} answer={answer}/></section>;
}
