"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { login } from "@/app/login/actions";
export function LoginForm({available}:{available:boolean}) {
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [state,action,pending] = useActionState(login,{error:""});
 return <form action={action} className="auth-form"><label htmlFor="email">이메일</label><input id="email" name="email" value={email} onChange={event=>setEmail(event.target.value)} type="email" autoComplete="email" placeholder="hello@example.com" maxLength={254} required disabled={!available}/><label htmlFor="password">비밀번호</label><input id="password" name="password" value={password} onChange={event=>setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="비밀번호를 입력해 주세요" required disabled={!available}/>{state.error && <p className="form-error" role="alert">{state.error}</p>}{!available && <p className="notice" role="status">로그인 연결을 준비하고 있어요. 아직 로그인할 수 없습니다.</p>}<button className="button green" disabled={pending||!available}>{pending?"로그인 중…":"로그인"}</button><Link className="text-link" href="/forgot-password">비밀번호를 잊으셨나요?</Link><p className="auth-secondary">아직 함께하지 않으셨나요? <Link href="/signup">회원가입 ↗</Link></p></form>;
}
