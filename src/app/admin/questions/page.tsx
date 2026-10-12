import {requireMember} from '@/lib/auth/session';
import {QuestionAdminForms,QuestionStatusForm,AnswerStatusForm} from '@/components/question-admin-forms';
export default async function Page(){
 const {supabase}=await requireMember('admin');
 const [{data:categories,error},{data:questions},{data:answers}]=await Promise.all([
  supabase.from('question_categories').select('id,name').eq('is_active',true).order('sort_order'),
  supabase.from('questions').select('id,title,type,is_active,question_categories(name)').order('created_at',{ascending:false}).limit(100),
  supabase.from('answers').select('id,text_value,option_id,hidden_at,profiles(nickname),questions(title),question_options(label)').is('deleted_at',null).order('updated_at',{ascending:false}).limit(30)
 ]);
 if(error)return <section className="placeholder"><h1>질문 관리</h1><p role="alert">질문 데이터를 불러오지 못했습니다. 새 데이터베이스 설정을 확인해 주세요.</p></section>;
 return <section className="content-section"><span className="eyebrow dark">QUESTION MANAGER</span><h1>질문 관리</h1><p>주관식·객관식·밸런스게임 질문을 등록하고 답변을 관리합니다.</p><QuestionAdminForms categories={categories??[]}/>
  <h2 className="admin-subheading">등록된 질문 {questions?.length??0}개</h2><div className="admin-list">{questions?.map(question=>{const category=Array.isArray(question.question_categories)?question.question_categories[0]:question.question_categories;return <article className="admin-list-row" key={question.id}><div><small>{category?.name} · {question.type==='text'?'주관식':question.type==='balance_game'?'밸런스게임':'객관식'} · {question.is_active?'공개':'비활성'}</small><h3>{question.title}</h3></div><QuestionStatusForm id={question.id} active={question.is_active}/></article>})}</div>
  <h2 className="admin-subheading">최근 답변</h2><div className="admin-list">{!answers?.length&&<p className="notice">등록된 답변이 없습니다.</p>}{answers?.map(answer=>{const person=Array.isArray(answer.profiles)?answer.profiles[0]:answer.profiles;const question=Array.isArray(answer.questions)?answer.questions[0]:answer.questions;const option=Array.isArray(answer.question_options)?answer.question_options[0]:answer.question_options;return <article className="admin-list-row" key={answer.id}><div><small>{person?.nickname} · {question?.title} · {answer.hidden_at?'숨김':'공개'}</small><p>{answer.text_value??option?.label}</p></div><AnswerStatusForm id={answer.id} hidden={!!answer.hidden_at}/></article>})}</div>
 </section>;
}
