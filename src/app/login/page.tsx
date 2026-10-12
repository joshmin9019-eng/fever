export const dynamic = "force-dynamic";
import { LoginForm } from "@/components/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export default async function Page({searchParams}:{searchParams:Promise<{reset?:string}>}) { const {reset}=await searchParams; return <section className="auth-section"><span className="eyebrow dark">WELCOME BACK</span><h1>다시 만나서 반가워요.</h1><p>우리의 이야기를 이어가 볼까요?</p>{reset==="success"&&<p className="notice" role="status">비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.</p>}<LoginForm available={isSupabaseConfigured()}/></section>; }
