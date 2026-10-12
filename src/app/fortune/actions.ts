"use server";
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {requireMember} from '@/lib/auth/session';
import {validMonthDay} from '@/lib/fortune';
export async function saveBirthdate(form:FormData){
 const {supabase}=await requireMember();
 const month=Number(form.get('month'));const day=Number(form.get('day'));
 if(!validMonthDay(month,day))redirect('/fortune?error=date');
 const {error}=await supabase.rpc('save_my_birthdate',{p_month:month,p_day:day,p_consent:form.get('consent')==='on'});
 if(error)redirect('/fortune?error=save');
 revalidatePath('/fortune');redirect('/fortune?saved=1');
}
export async function deleteBirthdate(){
 const {supabase}=await requireMember();
 const {error}=await supabase.rpc('delete_my_birthdate');
 if(error)redirect('/fortune?error=delete');
 revalidatePath('/fortune');redirect('/fortune?deleted=1');
}
