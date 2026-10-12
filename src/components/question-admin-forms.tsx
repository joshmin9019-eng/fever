"use client";
import {useActionState,useState} from 'react';
import {createCategory,createQuestion,createQuestionsBulk,setQuestionActive,setAnswerHidden} from '@/app/admin/questions/actions';
import {parseBulkQuestions} from '@/lib/questions/bulk';
type Category={id:string;name:string};
export function QuestionAdminForms({categories}:{categories:Category[]}){
 const [categoryState,categoryAction,categoryPending]=useActionState(createCategory,{error:'',success:''});
 const [questionState,questionAction,questionPending]=useActionState(createQuestion,{error:'',success:''});
 const [type,setType]=useState('text');
 return <div className="admin-form-grid"><form action={categoryAction} className="auth-form admin-card"><span className="eyebrow dark">STEP 1</span><h2>카테고리 만들기</h2><label htmlFor="categoryName">이름</label><input id="categoryName" name="name" maxLength={60} required placeholder="예: 취향"/>{categoryState.error&&<p role="alert" className="form-error">{categoryState.error}</p>}{categoryState.success&&<p role="status" className="notice">{categoryState.success}</p>}<button className="button green" disabled={categoryPending}>카테고리 추가</button></form>
  <form action={questionAction} className="auth-form admin-card"><span className="eyebrow dark">STEP 2</span><h2>질문 만들기</h2><label htmlFor="questionCategory">카테고리</label><select id="questionCategory" name="categoryId" required defaultValue=""><option value="" disabled>선택해 주세요</option>{categories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><label htmlFor="questionTitle">질문 문구</label><textarea id="questionTitle" name="title" required maxLength={300} placeholder="예: 쉬는 날 가고 싶은 곳은?"/><label htmlFor="questionType">답변 형식</label><select id="questionType" name="type" value={type} onChange={event=>setType(event.target.value)}><option value="text">주관식 · 글로 답하기</option><option value="single_choice">객관식 · 하나 고르기</option><option value="balance_game">밸런스게임 · 둘 중 하나</option></select><small>{type==='text'?'회원은 300자 이내의 글을 입력합니다.':type==='balance_game'?'서로 다른 두 선택지를 한 줄씩 입력하세요.':'선택지를 한 줄에 하나씩, 두 개 이상 입력하세요.'}</small>{type!=='text'&&<><label htmlFor="questionOptions">선택지</label><textarea id="questionOptions" name="options" required placeholder={type==='balance_game'?'아침형\n저녁형':'바다\n산\n도시'}/><small>한 줄이 선택지 하나입니다. 회원은 하나만 고를 수 있습니다.</small></>}{questionState.error&&<p role="alert" className="form-error">{questionState.error}</p>}{questionState.success&&<p role="status" className="notice">{questionState.success}</p>}<button className="button green" disabled={questionPending||!categories.length}>질문 등록</button></form></div>;
}
export function BulkQuestionForm({categories}:{categories:Category[]}){
 const [state,action,pending]=useActionState(createQuestionsBulk,{error:'',success:''});
 const [source,setSource]=useState('');
 const preview=parseBulkQuestions(source);
 return <section className="bulk-question-section" aria-labelledby="bulk-question-title"><span className="eyebrow dark">QUESTION BATCH</span><h2 id="bulk-question-title">여러 질문 한 번에 등록</h2><p>같은 카테고리의 질문을 한 줄에 하나씩 넣으세요. 등록 전에 형식과 선택지를 아래에서 확인할 수 있습니다.</p>
  <form action={action} className="auth-form"><label htmlFor="bulkCategory">카테고리</label><select id="bulkCategory" name="categoryId" required defaultValue=""><option value="" disabled>선택해 주세요</option>{categories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><label htmlFor="bulkQuestions">질문 목록</label><textarea id="bulkQuestions" name="bulkQuestions" value={source} onChange={event=>setSource(event.target.value)} rows={9} maxLength={30000} required placeholder={'주관식 | 요즘 가장 즐거운 순간은?\n객관식 | 쉬는 날 가고 싶은 곳은? | 바다 | 산 | 도시\n밸런스 | 여행은 계획형 vs 즉흥형? | 계획형 | 즉흥형'}/><small>형식 | 질문 | 선택지 순서입니다. 주관식은 선택지를 빼고, 객관식은 2개 이상, 밸런스는 정확히 2개입니다. 한 번에 최대 50개.</small>
   {!!source.trim()&&<div className="bulk-preview"><strong>등록 미리보기 · {preview.questions.length}개 질문</strong>{preview.errors.length>0&&<ul className="bulk-errors">{preview.errors.map((message,index)=><li key={index}>{message}</li>)}</ul>}<ol>{preview.questions.map(item=><li key={item.line}><span>{item.line}행 · {item.type==='text'?'주관식':item.type==='balance_game'?'밸런스':'객관식'}</span><strong>{item.title}</strong>{item.options.length>0&&<small>{item.options.join(' / ')}</small>}</li>)}</ol></div>}
   {state.error&&<p role="alert" className="form-error">{state.error}</p>}{state.success&&<p role="status" className="notice">{state.success}</p>}
   <button className="button green" disabled={pending||!categories.length||!preview.questions.length||!!preview.errors.length}>{pending?'등록 중…':'미리보기대로 질문 등록'}</button>
  </form>
 </section>;
}
export function QuestionStatusForm({id,active}:{id:string;active:boolean}){
 const [state,action,pending]=useActionState(setQuestionActive,{error:'',success:''});
 return <form action={action}><input type="hidden" name="questionId" value={id}/><button className="button soft" name="active" value={active?'false':'true'} disabled={pending}>{active?'비활성화':'다시 활성화'}</button>{state.error&&<p role="alert" className="form-error">{state.error}</p>}</form>;
}
export function AnswerStatusForm({id,hidden}:{id:string;hidden:boolean}){
 const [state,action,pending]=useActionState(setAnswerHidden,{error:'',success:''});
 return <form action={action}><input type="hidden" name="answerId" value={id}/><button className="button soft" name="hidden" value={hidden?'false':'true'} disabled={pending}>{hidden?'다시 공개':'답변 숨김'}</button>{state.error&&<p role="alert" className="form-error">{state.error}</p>}</form>;
}
