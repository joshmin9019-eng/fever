export const dynamic = "force-dynamic";
import {SignupForm} from "@/components/signup-form";
import {isSupabaseConfigured} from "@/lib/supabase/config";
import {legalConfig} from "@/lib/auth/legal";
export default function Page(){const legal=legalConfig();return <section className="auth-section"><span className="eyebrow dark">JOIN OUR COMMUNITY</span><h1>FEVER 함께하기</h1><p>계정 만들기 → 프로필과 사진 → 관리자 승인</p><SignupForm available={isSupabaseConfigured()} termsUrl={legal.termsUrl} privacyUrl={legal.privacyUrl}/></section>;}
