"use client";
import {useActionState} from 'react';
import {saveQuestionAnswer,deleteQuestionAnswer} from '@/app/questions/[id]/actions';
type Option={id:string;label:string;sort_order:number};
export function AnswerForm({questionId,type,options,answer}:{questionId:string;type:string;options:Option[];answer?:{text_value:string|null;option_id:string|null}|null}){
 const [state,action,pending]=useActionState(saveQuestionAnswer,{error:'',success:''});
 const [deleteState,deleteAction,deleting]=useActionState(deleteQuestionAnswer,{error:'',success:''});
 return <div className="answer-controls"><form action={action} className="auth-form answer-form"><input type="hidden" name="questionId" value={questionId}/><input type="hidden" name="type" value={type}/>
  {type==='text'?<><label htmlFor="answerText">내 답변</label><textarea id="answerText" name="text" required maxLength={300} defaultValue={answer?.text_value??''} placeholder="300자 이내로 답해 주세요"/></>:<fieldset><legend>하나만 선택해 주세요</legend><div className="choice-list">{options.map(option=><label key={option.id}><input type="radio" name="option" value={option.id} required defaultChecked={answer?.option_id===option.id}/><span>{option.label}</span></label>)}</div></fieldset>}
  {state.error&&<p role="alert" className="form-error">{state.error}</p>}{state.success&&<p role="status" className="notice">{state.success}</p>}
  <button className="button green" disabled={pending}>답변 {answer?'수정':'저장'}</button></form>
  {answer&&<form action={deleteAction}><input type="hidden" name="questionId" value={questionId}/><button className="button soft" disabled={deleting}>내 답변 삭제</button>{deleteState.error&&<p role="alert" className="form-error">{deleteState.error}</p>}{deleteState.success&&<p role="status" className="notice">{deleteState.success}</p>}</form>}
 </div>;
}
