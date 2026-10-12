"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { headers } from "next/headers";
export async function signup(_previous:{error:string},form:FormData):Promise<{error:string}>{
 if(!isSupabaseConfigured())return {error:"회원가입 연결을 준비하고 있어요."};
 const email=String(form.get("email")??"").trim();const password=String(form.get("password")??"");
 if(!email||email.length>254||password.length<8||password.length>4096||password!==form.get("passwordConfirm"))return {error:"이메일과 비밀번호를 확인해 주세요. 비밀번호는 8자 이상이어야 합니다."};
 const client=await createClient();const origin=(await headers()).get("origin");
 if(!origin)return {error:"요청 주소를 확인할 수 없습니다."};
 try{
 const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:`${origin}/auth/callback`}});
 if(error)return {error:"계정을 만들 수 없습니다. 입력 정보와 이메일을 확인하거나 잠시 후 다시 시도해 주세요."};
 }catch{return {error:"연결에 문제가 있어요. 잠시 후 다시 시도해 주세요."};}
 redirect("/signup/check-email");
}
