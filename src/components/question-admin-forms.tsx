"use client";
import {useActionState,useState} from 'react';
import {createCategory,createQuestion,setQuestionActive,setAnswerHidden} from '@/app/admin/questions/actions';
type Category={id:string;name:string};
export function QuestionAdminForms({categories}:{categories:Category[]}){
 const [categoryState,categoryAction,categoryPending]=useActionState(createCategory,{error:'',success:''});
 const [questionState,questionAction,questionPending]=useActionState(createQuestion,{error:'',success:''});
 const [type,setType]=useState('text');
 return <div className="admin-form-grid"><form action={categoryAction} className="auth-form admin-card"><span className="eyebrow dark">STEP 1</span><h2>카테고리 만들기</h2><label htmlFor="categoryName">이름</label><input id="categoryName" name="name" maxLength={60} required placeholder="예: 취향"/>{categoryState.error&&<p role="alert" className="form-error">{categoryState.error}</p>}{categoryState.success&&<p role="status" className="notice">{categoryState.success}</p>}<button className="button green" disabled={categoryPending}>카테고리 추가</button></form>
  <form action={questionAction} className="auth-form admin-card"><span className="eyebrow dark">STEP 2</span><h2>질문 만들기</h2><label htmlFor="questionCategory">카테고리</label><select id="questionCategory" name="categoryId" required defaultValue=""><option value="" disabled>선택해 주세요</option>{categories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><label htmlFor="questionTitle">질문 문구</label><textarea id="questionTitle" name="title" required maxLength={300} placeholder="예: 쉬는 날 가고 싶은 곳은?"/><label htmlFor="questionType">답변 형식</label><select id="questionType" name="type" value={type} onChange={event=>setType(event.target.value)}><option value="text">주관식 · 글로 답하기</option><option value="single_choice">객관식 · 하나 고르기</option><option value="balance_game">밸런스게임 · 둘 중 하나</option></select><small>{type==='text'?'회원은 300자 이내의 글을 입력합니다.':type==='balance_game'?'서로 다른 두 선택지를 한 줄씩 입력하세요.':'선택지를 한 줄에 하나씩, 두 개 이상 입력하세요.'}</small>{type!=='text'&&<><label htmlFor="questionOptions">선택지</label><textarea id="questionOptions" name="options" required placeholder={type==='balance_game'?'아침형\n저녁형':'바다\n산\n도시'}/><small>한 줄이 선택지 하나입니다. 회원은 하나만 고를 수 있습니다.</small></>}{questionState.error&&<p role="alert" className="form-error">{questionState.error}</p>}{questionState.success&&<p role="status" className="notice">{questionState.success}</p>}<button className="button green" disabled={questionPending||!categories.length}>질문 등록</button></form></div>;
}
export function QuestionStatusForm({id,active}:{id:string;active:boolean}){
 const [state,action,pending]=useActionState(setQuestionActive,{error:'',success:''});
 return <form action={action}><input type="hidden" name="questionId" value={id}/><button className="button soft" name="active" value={active?'false':'true'} disabled={pending}>{active?'비활성화':'다시 활성화'}</button>{state.error&&<p role="alert" className="form-error">{state.error}</p>}</form>;
}
export function AnswerStatusForm({id,hidden}:{id:string;hidden:boolean}){
 const [state,action,pending]=useActionState(setAnswerHidden,{error:'',success:''});
 return <form action={action}><input type="hidden" name="answerId" value={id}/><button className="button soft" name="hidden" value={hidden?'false':'true'} disabled={pending}>{hidden?'다시 공개':'답변 숨김'}</button>{state.error&&<p role="alert" className="form-error">{state.error}</p>}</form>;
}
