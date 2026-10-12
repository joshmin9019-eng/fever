"use server";
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
  const {error} = await supabase.auth.signInWithPassword({email,password});
  if (error) return {error:"로그인할 수 없어요. 이메일·비밀번호와 이메일 인증 여부를 확인해 주세요."};
 } catch { return {error:"연결에 문제가 있어요. 잠시 후 다시 시도해 주세요."}; }
 redirect("/profile");
}
export async function logout() {
 if (isSupabaseConfigured()) { const client = await createClient(); const {error} = await client.auth.signOut(); if(error) redirect("/auth/error"); }
 redirect("/login");
}
