import {requireUser} from "@/lib/auth/session";
import {ResetPasswordForm} from "@/components/reset-password-form";
export default async function Page(){const {user}=await requireUser();return <section className="auth-section"><span className="eyebrow dark">ACCOUNT RECOVERY</span><h1>새 비밀번호 설정</h1><p><strong>{user.email}</strong> 계정의 비밀번호를 변경합니다.</p><p>8자 이상의 새 비밀번호를 입력해 주세요.<br/>가입 승인 상태와 관리자 권한은 바뀌지 않습니다.</p><ResetPasswordForm/></section>;}
