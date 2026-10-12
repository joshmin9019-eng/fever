export const dynamic = "force-dynamic";
import { LoginForm } from "@/components/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export default function Page() { return <section className="auth-section"><span className="eyebrow dark">WELCOME BACK</span><h1>다시 만나서 반가워요.</h1><p>우리의 이야기를 이어가 볼까요?</p><LoginForm available={isSupabaseConfigured()}/></section>; }
