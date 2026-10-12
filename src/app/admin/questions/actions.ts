"use server";
import {revalidatePath} from 'next/cache';
import {requireMember} from '@/lib/auth/session';
type State={error:string;success:string};
export async function createCategory(_previous:State,form:FormData):Promise<State>{
 const {supabase}=await requireMember('admin');const name=String(form.get('name')??'').trim();
 if(!name||name.length>60)return {error:'카테고리 이름을 확인해 주세요.',success:''};
 const {error}=await supabase.rpc('create_question_category',{p_name:name});
 if(error)return {error:'카테고리를 만들지 못했습니다. 중복 이름인지 확인해 주세요.',success:''};
 revalidatePath('/admin/questions');return {error:'',success:'카테고리를 만들었습니다.'};
}
export async function createQuestion(_previous:State,form:FormData):Promise<State>{
 const {supabase}=await requireMember('admin');
 const category=String(form.get('categoryId')??'');const title=String(form.get('title')??'').trim();const type=String(form.get('type')??'');
 const options=String(form.get('options')??'').split('\n').map(item=>item.trim()).filter(Boolean);
 if(!/^[0-9a-f-]{36}$/i.test(category)||!title||title.length>300||!['text','single_choice','balance_game'].includes(type))return {error:'질문 내용을 확인해 주세요.',success:''};
 if(type==='text'?options.length!==0:type==='balance_game'?options.length!==2:options.length<2)return {error:'선택지 개수를 확인해 주세요.',success:''};
 if(options.some(item=>item.length>200))return {error:'선택지는 각각 200자 이내로 입력해 주세요.',success:''};
 const {error}=await supabase.rpc('create_question',{p_category_id:category,p_title:title,p_type:type,p_option_labels:options});
 if(error)return {error:'질문을 등록하지 못했습니다. 카테고리와 선택지를 확인해 주세요.',success:''};
 revalidatePath('/admin/questions');revalidatePath('/questions');return {error:'',success:'질문을 등록했습니다.'};
}
export async function setQuestionActive(_previous:State,form:FormData):Promise<State>{
 const {supabase}=await requireMember('admin');const id=String(form.get('questionId')??'');const active=String(form.get('active')??'');
 if(!/^[0-9a-f-]{36}$/i.test(id)||!['true','false'].includes(active))return {error:'질문을 확인해 주세요.',success:''};
 const {error}=await supabase.rpc('set_question_active',{p_question_id:id,p_active:active==='true'});
 if(error)return {error:'질문 상태를 바꾸지 못했습니다.',success:''};
 revalidatePath('/admin/questions');revalidatePath('/questions');return {error:'',success:'질문 상태를 변경했습니다.'};
}
export async function setAnswerHidden(_previous:State,form:FormData):Promise<State>{
 const {supabase}=await requireMember('admin');const id=String(form.get('answerId')??'');const hidden=String(form.get('hidden')??'');
 if(!/^[0-9a-f-]{36}$/i.test(id)||!['true','false'].includes(hidden))return {error:'답변을 확인해 주세요.',success:''};
 const {error}=await supabase.rpc('set_answer_hidden',{p_answer_id:id,p_hidden:hidden==='true'});
 if(error)return {error:'답변 상태를 바꾸지 못했습니다.',success:''};
 revalidatePath('/admin/questions');return {error:'',success:'답변 상태를 변경했습니다.'};
}
