export const dynamic="force-dynamic";
import Link from "next/link";
import {RecoveryForm} from "@/components/recovery-form";
import {isSupabaseConfigured} from "@/lib/supabase/config";
export default function Page(){return <section className="auth-section"><span className="eyebrow dark">ACCOUNT RECOVERY</span><h1>비밀번호 찾기</h1><p>FEVER에 가입한 이메일로 새 비밀번호를 설정하세요.<br/>기존 가입 상태와 관리자 권한은 유지됩니다.</p><RecoveryForm available={isSupabaseConfigured()}/><Link className="text-link" href="/login">로그인으로 돌아가기</Link></section>;}
