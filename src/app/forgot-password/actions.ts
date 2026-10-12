"use server";
import {headers} from "next/headers";
import {createClient} from "@/lib/supabase/server";
import {isSupabaseConfigured} from "@/lib/supabase/config";
export type RecoveryState={error:string;sent:boolean};
export async function requestRecovery(_previous:RecoveryState,form:FormData):Promise<RecoveryState>{
 if(!isSupabaseConfigured())return {error:"로그인 연결을 준비하고 있습니다.",sent:false};
 const email=String(form.get('email')??'').trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return {error:"이메일 주소를 확인해 주세요.",sent:false};
 const origin=(await headers()).get('origin');
 if(!origin)return {error:"요청 주소를 확인하지 못했습니다.",sent:false};
 const client=await createClient();
 try{
  const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:new URL('/auth/recovery',origin).toString()});
  if(error)return {error:"재설정 메일을 요청하지 못했습니다. 잠시 후 다시 시도해 주세요.",sent:false};
 }catch{return {error:"연결에 문제가 있습니다. 잠시 후 다시 시도해 주세요.",sent:false};}
 // Same response for registered and unregistered addresses.
 return {error:"",sent:true};
}
