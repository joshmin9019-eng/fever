"use server";
import { loginErrorMessage } from "@/lib/auth/login-errors";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export type LoginState = { error: string };
export async function login(_previous: LoginState, form: FormData): Promise<LoginState> {
 if (!isSupabaseConfigured()) return { error: "로그인 연결을 준비하고 있어요. 잠시 후 다시 확인해 주세요." };
 const email = String(form.get("email") ?? "").trim();
 const password = String(form.get("password") ?? "");
 if (!email || !password || email.length > 254 || password.length > 4096) return {error:"이메일과 비밀번호를 확인해 주세요."};
 const supabase = await createClient();
 try {
  const {data,error} = await supabase.auth.signInWithPassword({email,password});
  if (error) {
   const code=error.code && /^[a-z0-9_]+$/i.test(error.code)?error.code:undefined;
   console.warn("auth.login.failed",{code:code??"unknown",status:error.status});
   const message=loginErrorMessage(code,error.status);
   return {error:code?`${message} (문의 코드: ${code})`:message};
  }
  if(!data.session)return {error:"로그인 세션을 만들지 못했습니다. 다시 시도해 주세요."};
 } catch { return {error:"연결에 문제가 있어요. 잠시 후 다시 시도해 주세요."}; }
 redirect("/profile");
}
export async function logout() {
 if (isSupabaseConfigured()) { const client = await createClient(); const {error} = await client.auth.signOut(); if(error) redirect("/auth/error"); }
 redirect("/login");
}
