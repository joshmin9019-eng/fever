"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { legalConfig } from "@/lib/auth/legal";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export async function signup(_previous:{error:string},form:FormData):Promise<{error:string}>{
 if(!isSupabaseConfigured())return {error:"회원가입 연결을 준비하고 있어요."};
 const email=String(form.get("email")??"").trim();const password=String(form.get("password")??"");
 if(!email||email.length>254||password.length<8||password.length>4096||password!==form.get("passwordConfirm"))return {error:"이메일과 비밀번호를 확인해 주세요. 비밀번호는 8자 이상이어야 합니다."};
 if(form.get("terms")!=="on"||form.get("privacy")!=="on")return {error:"이용약관과 개인정보 수집·이용에 동의해 주세요."};
 const legal=legalConfig();
 const client=await createClient();
 try{
  const {data,error}=await client.auth.signUp({email,password,options:{data:{signup_consent:{terms_accepted:true,privacy_accepted:true,terms_version:legal.termsVersion,privacy_version:legal.privacyVersion,accepted_at:new Date().toISOString()}}}});
  if(error)return {error:error.code==='user_already_exists'?"이미 가입된 이메일입니다. 로그인해서 가입 신청을 이어가 주세요.":"계정을 만들 수 없습니다. 입력 정보를 확인하거나 운영진에게 문의해 주세요."};
  if(!data.session){
   // Auth settings or a pre-existing unconfirmed account can prevent a session.
   // Never treat an absent session as successful authentication.
   const {data:loginData,error:loginError}=await client.auth.signInWithPassword({email,password});
   if(loginError||!loginData.session)return {error:"가입정보 화면으로 이동하지 못했습니다. 이메일 인증 설정 또는 기존 계정 상태를 운영진에게 확인해 주세요."};
  }
 }catch{return {error:"연결에 문제가 있어요. 잠시 후 다시 시도해 주세요."};}
 redirect("/pending");
}
