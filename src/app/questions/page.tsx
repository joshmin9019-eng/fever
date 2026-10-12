import {requireMember} from '@/lib/auth/session';
import Link from 'next/link';
export default async function Page(){
 const {supabase,user}=await requireMember();
 const [{data:questions,error},{data:answers}]=await Promise.all([
  supabase.from('questions').select('id,title,type,sort_order,question_categories(name,sort_order)').eq('is_active',true).order('sort_order'),
  supabase.from('answers').select('question_id').eq('user_id',user.id).is('deleted_at',null).is('hidden_at',null)
 ]);
 if(error)return <section className="placeholder"><h1>서로를 알아가는 질문</h1><p role="alert">질문을 불러오지 못했습니다. 새 데이터베이스 설정을 확인해 주세요.</p></section>;
 const answered=new Set((answers??[]).map(item=>item.question_id));
 const grouped=new Map<string,typeof questions>();
 for(const question of questions??[]){const category=Array.isArray(question.question_categories)?question.question_categories[0]:question.question_categories;const name=category?.name??'기타';grouped.set(name,[...(grouped.get(name)??[]),question]);}
 return <section className="content-section"><span className="eyebrow dark">GET TO KNOW YOU</span><h1>서로를 알아가는 질문</h1><p>답변은 다른 승인 회원에게 공개되며 언제든 수정·삭제할 수 있습니다.</p><div className="question-progress">내 답변 {answered.size} / 전체 {questions?.length??0}</div>
  {!questions?.length&&<div className="notice">아직 등록된 질문이 없습니다. 관리자가 질문을 추가하면 이곳에 표시됩니다.</div>}
  {[...grouped.entries()].map(([name,items])=><section className="question-group" key={name}><h2>{name}</h2>{items?.map((question,index)=><Link className="question-row" href={`/questions/${question.id}`} key={question.id}><span className="question-number">{String(index+1).padStart(2,'0')}</span><div><strong>{question.title}</strong><small>{question.type==='text'?'주관식':question.type==='balance_game'?'밸런스게임':'객관식'}</small></div><span className={answered.has(question.id)?'answered-badge':'unanswered-badge'}>{answered.has(question.id)?'답변함':'답변하기'}</span></Link>)}</section>)}
 </section>;
}
