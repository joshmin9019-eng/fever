"use client";
import {useActionState,useState} from "react";
import {requestRecovery} from "@/app/forgot-password/actions";
export function RecoveryForm({available}:{available:boolean}){
 const [email,setEmail]=useState('');
 const [state,action,pending]=useActionState(requestRecovery,{error:'',sent:false});
 return <form action={action} className="auth-form"><label htmlFor="recoveryEmail">가입한 이메일</label><input id="recoveryEmail" name="email" type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} required disabled={!available||pending}/>{state.error&&<p role="alert" className="form-error">{state.error}</p>}{state.sent&&<p role="status" className="notice">가입된 주소인 경우 비밀번호 재설정 메일을 보냈습니다. 받은편지함과 스팸함을 확인해 주세요. 메일 링크는 요청한 브라우저에서 열어 주세요.</p>}{!available&&<p className="notice">로그인 연결을 준비하고 있습니다.</p>}<button className="button green" disabled={!available||pending}>{pending?'요청 중…':'비밀번호 재설정 메일 받기'}</button></form>;
}
