"use client";
import {useActionState,useState} from 'react';
import {createCategory,createQuestion,setQuestionActive,setAnswerHidden} from '@/app/admin/questions/actions';
type Category={id:string;name:string};
export function QuestionAdminForms({categories}:{categories:Category[]}){
 const [categoryState,categoryAction,categoryPending]=useActionState(createCategory,{error:'',success:''});
 const [questionState,questionAction,questionPending]=useActionState(createQuestion,{error:'',success:''});
 const [type,setType]=useState('text');
 return <div className="admin-form-grid"><form action={categoryAction} className="auth-form admin-card"><h2>카테고리 만들기</h2><label htmlFor="categoryName">이름</label><input id="categoryName" name="name" maxLength={60} required placeholder="예: 우리 이야기"/>{categoryState.error&&<p role="alert" className="form-error">{categoryState.error}</p>}{categoryState.success&&<p role="status" className="notice">{categoryState.success}</p>}<button className="button green" disabled={categoryPending}>카테고리 추가</button></form>
  <form action={questionAction} className="auth-form admin-card"><h2>질문 만들기</h2><label htmlFor="questionCategory">카테고리</label><select id="questionCategory" name="categoryId" required defaultValue=""><option value="" disabled>선택해 주세요</option>{categories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><label htmlFor="questionTitle">질문</label><textarea id="questionTitle" name="title" required maxLength={300} placeholder="질문 문구를 입력해 주세요"/><label htmlFor="questionType">형식</label><select id="questionType" name="type" value={type} onChange={event=>setType(event.target.value)}><option value="text">주관식</option><option value="single_choice">객관식</option><option value="balance_game">밸런스게임</option></select>{type!=='text'&&<><label htmlFor="questionOptions">선택지</label><textarea id="questionOptions" name="options" required placeholder="한 줄에 선택지 하나씩 입력해 주세요"/><small>객관식은 2개 이상, 밸런스게임은 정확히 2개입니다.</small></>}{questionState.error&&<p role="alert" className="form-error">{questionState.error}</p>}{questionState.success&&<p role="status" className="notice">{questionState.success}</p>}<button className="button green" disabled={questionPending||!categories.length}>질문 등록</button></form></div>;
}
export function QuestionStatusForm({id,active}:{id:string;active:boolean}){
 const [state,action,pending]=useActionState(setQuestionActive,{error:'',success:''});
 return <form action={action}><input type="hidden" name="questionId" value={id}/><button className="button soft" name="active" value={active?'false':'true'} disabled={pending}>{active?'비활성화':'다시 활성화'}</button>{state.error&&<p role="alert" className="form-error">{state.error}</p>}</form>;
}
export function AnswerStatusForm({id,hidden}:{id:string;hidden:boolean}){
 const [state,action,pending]=useActionState(setAnswerHidden,{error:'',success:''});
 return <form action={action}><input type="hidden" name="answerId" value={id}/><button className="button soft" name="hidden" value={hidden?'false':'true'} disabled={pending}>{hidden?'다시 공개':'답변 숨김'}</button>{state.error&&<p role="alert" className="form-error">{state.error}</p>}</form>;
}
