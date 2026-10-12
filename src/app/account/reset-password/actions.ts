"use server";
import {redirect} from "next/navigation";
import {requireUser} from "@/lib/auth/session";
export async function resetPassword(_previous:{error:string},form:FormData):Promise<{error:string}>{
 const {supabase}=await requireUser();
 const password=String(form.get('password')??'');
 if(password.length<8||password.length>4096||password!==form.get('passwordConfirm'))return {error:"새 비밀번호는 8자 이상이어야 하며 확인 값이 같아야 합니다."};
 try{
  const {error}=await supabase.auth.updateUser({password});
  if(error)return {error:"비밀번호를 변경하지 못했습니다. 새 비밀번호를 확인하거나 재설정 메일을 다시 요청해 주세요."};
  await supabase.auth.signOut({scope:'global'});
 }catch{return {error:"연결에 문제가 있습니다. 잠시 후 다시 확인해 주세요."};}
 redirect('/login?reset=success');
}
