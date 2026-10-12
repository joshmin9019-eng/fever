export const dynamic = "force-dynamic";
import {SignupForm} from "@/components/signup-form";
import {isSupabaseConfigured} from "@/lib/supabase/config";
export default function Page(){return <section className="auth-section"><span className="eyebrow dark">JOIN OUR COMMUNITY</span><h1>FEVER 함께하기</h1><p>이메일 인증 → 프로필과 사진 → 관리자 승인</p><SignupForm available={isSupabaseConfigured()}/></section>;}
