"use client";
import {useActionState} from "react";
import {review} from "@/app/admin/members/actions";
export function ReviewForm({id,rejected=false}:{id:string;rejected?:boolean}){
 const [state,action,pending]=useActionState(review,{error:""});
 return <form action={action} className="auth-form"><input type="hidden" name="requestId" value={id}/>{rejected?<button name="decision" value="reapply" className="button green" disabled={pending}>재신청 허용</button>:<><label htmlFor={`reason-${id}`}>반려 사유 (선택)</label><input id={`reason-${id}`} name="reason" maxLength={500}/><div className="review-buttons"><button name="decision" value="approve" className="button green" disabled={pending}>가입 승인</button><button name="decision" value="reject" className="button" disabled={pending}>반려</button></div></>}{state.error&&<p className="form-error" role="alert">{state.error}</p>}</form>;
}
