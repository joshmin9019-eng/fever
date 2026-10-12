"use client";
import {useActionState} from "react";
import {reviewNickname} from "@/app/admin/members/nickname-actions";
export function NicknameReviewForm({id}:{id:string}){
 const [state,action,pending]=useActionState(reviewNickname,{error:""});
 return <form action={action} className="review-buttons"><input type="hidden" name="requestId" value={id}/><button className="button green" name="decision" value="approve" disabled={pending}>승인</button><button className="button soft" name="decision" value="reject" disabled={pending}>반려</button>{state.error&&<p role="alert" className="form-error">{state.error}</p>}</form>;
}
