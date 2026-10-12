"use client";
import {useActionState,useState} from "react";
import {resetPassword} from "@/app/account/reset-password/actions";
export function ResetPasswordForm(){
 const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');
 const [state,action,pending]=useActionState(resetPassword,{error:''});
 return <form className="auth-form" action={action}><label htmlFor="newPassword">새 비밀번호</label><input id="newPassword" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={4096} required value={password} onChange={e=>setPassword(e.target.value)}/><label htmlFor="newPasswordConfirm">새 비밀번호 확인</label><input id="newPasswordConfirm" name="passwordConfirm" type="password" autoComplete="new-password" minLength={8} maxLength={4096} required value={confirm} onChange={e=>setConfirm(e.target.value)}/>{state.error&&<p role="alert" className="form-error">{state.error}</p>}<button className="button green" disabled={pending}>{pending?'변경 중…':'새 비밀번호 저장'}</button></form>;
}
