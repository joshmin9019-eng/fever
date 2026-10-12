"use server";
import {revalidatePath} from "next/cache";
import {requireMember} from "@/lib/auth/session";
export async function review(_previous:{error:string},form:FormData):Promise<{error:string}>{
 const {supabase}=await requireMember("admin");
 const id=String(form.get("requestId")??"");const decision=form.get("decision");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!['approve','reject','reapply'].includes(String(decision)))return {error:"요청을 확인해 주세요."};
 const {error}=decision==='reapply'?await supabase.rpc('allow_reapplication',{p_request_id:id}):await supabase.rpc("review_membership",{p_request_id:id,p_approve:decision==='approve',p_reason:String(form.get("reason")??"").slice(0,500)});
 if(error)return {error:"처리하지 못했습니다. 이미 처리된 요청인지 확인하고 다시 시도해 주세요."};
 revalidatePath('/admin/members');return {error:""};
}
