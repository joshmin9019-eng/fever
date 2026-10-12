"use client";
import {useActionState} from "react";
import {signup} from "@/app/signup/actions";
export function SignupForm({available}:{available:boolean}){
 const [state,action,pending]=useActionState(signup,{error:""});
 return <form className="auth-form" action={action}><label htmlFor="email">이메일</label><input id="email" name="email" type="email" autoComplete="email" required disabled={!available}/><label htmlFor="password">비밀번호</label><input id="password" name="password" type="password" minLength={8} maxLength={4096} autoComplete="new-password" placeholder="8자 이상" required disabled={!available}/><label htmlFor="passwordConfirm">비밀번호 확인</label><input id="passwordConfirm" name="passwordConfirm" type="password" autoComplete="new-password" required disabled={!available}/>{!available&&<p className="notice">회원가입 연결을 준비하고 있어요. 아직 가입 신청을 제출할 수 없습니다.</p>}{state.error&&<p role="alert" className="form-error">{state.error}</p>}<button className="button green" disabled={!available||pending}>{pending?"처리 중…":"이메일 인증 시작하기"}</button><p className="auth-secondary">이메일 인증 후 사진과 기본 정보를 입력하면<br/>가입 신청이 완료됩니다.</p></form>;
}
