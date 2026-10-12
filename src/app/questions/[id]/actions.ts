"use server";
import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth/session";
export async function saveQuestionAnswer(_previous:{error:string;success:string},form:FormData):Promise<{error:string;success:string}>{
 const {supabase}=await requireMember();
 const id=String(form.get("questionId")??"");
 const type=String(form.get("type")??"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return {error:"질문을 확인해 주세요.",success:""};
 const text=String(form.get("text")??"").trim();
 const option=String(form.get("option")??"");
 if(type==='text'?(text.length<1||text.length>300):!(/^[0-9a-f-]{36}$/i.test(option)))return {error:"답변을 확인해 주세요.",success:""};
 const {error}=await supabase.rpc('save_answer',{p_question_id:id,p_text_value:type==='text'?text:null,p_option_id:type==='text'?null:option});
 if(error)return {error:"답변을 저장하지 못했습니다. 질문이 아직 활성 상태인지 확인해 주세요.",success:""};
 revalidatePath('/');revalidatePath('/questions');revalidatePath(`/questions/${id}`);revalidatePath('/profile');
 return {error:"",success:"답변을 저장했습니다."};
}
export async function deleteQuestionAnswer(_previous:{error:string;success:string},form:FormData):Promise<{error:string;success:string}>{
 const {supabase}=await requireMember();
 const id=String(form.get('questionId')??'');
 if(!/^[0-9a-f-]{36}$/i.test(id))return {error:'질문을 확인해 주세요.',success:''};
 const {error}=await supabase.rpc('delete_answer',{p_question_id:id});
 if(error)return {error:'답변을 삭제하지 못했습니다.',success:''};
 revalidatePath('/');revalidatePath('/questions');revalidatePath(`/questions/${id}`);revalidatePath('/profile');
 return {error:'',success:'답변을 삭제했습니다.'};
}
