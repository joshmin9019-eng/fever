"use server";
import {redirect} from "next/navigation";
import {requireUser} from "@/lib/auth/session";
import {validNickname,validAvatar} from "@/lib/auth/registration";
import {legalConfig} from "@/lib/auth/legal";
export async function submitRegistration(_previous:{error:string},form:FormData):Promise<{error:string}>{
 const {supabase,user}=await requireUser();
 if(!user.email_confirmed_at)return {error:"이메일을 먼저 인증해 주세요."};
 const legal=legalConfig();if(!legal.ready)return {error:"약관과 개인정보 안내를 준비 중입니다."};
 const nickname=String(form.get("nickname")??"");const birthYear=Number(form.get("birthYear"));const region=String(form.get("region")??"").trim();
 const year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Asia/Seoul'}).format(new Date()));
 if(!validNickname(nickname))return {error:"닉네임은 한글·영문·숫자·밑줄 2~20자여야 합니다."};
 if(!Number.isInteger(birthYear)||birthYear<1||birthYear>year||!region||region.length>100)return {error:"출생연도와 거주지역을 확인해 주세요."};
 if(form.get("terms")!=="on"||form.get("privacy")!=="on")return {error:"약관 및 개인정보 수집·이용에 동의해 주세요."};
 const avatar=form.get("avatar");if(!(avatar instanceof File)||avatar.size>5*1024*1024)return {error:"5MB 이하의 JPEG·PNG·WebP 사진이 필요합니다."};
 const bytes=new Uint8Array(await avatar.arrayBuffer());if(!validAvatar(bytes,avatar.type))return {error:"사진 형식과 파일 내용을 확인해 주세요."};
 const extension={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[avatar.type];
 const path=`${user.id}/${crypto.randomUUID()}.${extension}`;
 const {error:uploadError}=await supabase.storage.from("avatars").upload(path,bytes,{contentType:avatar.type,upsert:false});
 if(uploadError)return {error:"사진을 업로드하지 못했습니다. 다시 시도해 주세요."};
 const {error}=await supabase.rpc("submit_membership",{p_nickname:nickname,p_birth_year:birthYear,p_region:region,p_avatar_path:path,p_terms_version:legal.termsVersion,p_privacy_version:legal.privacyVersion});
 if(error){await supabase.storage.from('avatars').remove([path]);return {error:error.code==='23505'?"이미 사용 중인 닉네임입니다. 다른 닉네임으로 다시 시도해 주세요.":"가입 신청을 완료하지 못했습니다. 계정 상태를 확인하고 다시 시도해 주세요."};}
 redirect("/pending");
}
