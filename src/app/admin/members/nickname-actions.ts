"use server";
import {revalidatePath} from "next/cache";
import {requireMember} from "@/lib/auth/session";
export async function reviewNickname(_previous:{error:string},form:FormData):Promise<{error:string}>{
 const {supabase}=await requireMember("admin");
 const id=String(form.get("requestId")??"");
 const decision=String(form.get("decision")??"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!['approve','reject'].includes(decision))return {error:"요청을 확인해 주세요."};
 const {error}=await supabase.rpc("review_nickname_change",{p_request_id:id,p_approve:decision==='approve'});
 if(error)return {error:error.message.includes('NICKNAME_TAKEN')?'이미 사용 중인 닉네임입니다.':'처리하지 못했습니다. 요청 상태를 확인해 주세요.'};
 revalidatePath('/admin/members');revalidatePath('/members');
 return {error:""};
}
