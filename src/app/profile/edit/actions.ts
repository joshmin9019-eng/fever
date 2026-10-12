"use server";
import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth/session";
import { validAvatar } from "@/lib/auth/registration";

export async function saveProfile(_previous: { error: string; success: string }, form: FormData): Promise<{ error: string; success: string }> {
 const { supabase, user } = await requireMember();
 const year = Number(form.get("birthYear"));
 const currentYear = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Seoul" }).format(new Date()));
 const region = String(form.get("region") ?? "").trim();
 const gender = String(form.get("gender") ?? "");
 const job = String(form.get("job") ?? "").trim();
 const mbti = String(form.get("mbti") ?? "");
 const bio = String(form.get("bio") ?? "").trim();
 const interestIds = form.getAll("interestId").map(String);
 if (!Number.isInteger(year) || year < 1 || year > currentYear || !region || region.length > 100) return { error: "출생연도와 거주지역을 확인해 주세요.", success: "" };
 if (!['', 'male', 'female'].includes(gender) || job.length > 80 || bio.length > 500 || (mbti && !/^[IE][NS][FT][JP]$/.test(mbti))) return { error: "프로필 입력 내용을 확인해 주세요.", success: "" };
 if (interestIds.length > 30 || interestIds.some(id => !/^[0-9a-f-]{36}$/i.test(id))) return { error: "관심사를 확인해 주세요.", success: "" };
 const { data: before } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single();
 let path: string | null = null;
 const avatar = form.get("avatar");
 if (avatar instanceof File && avatar.size) {
  if (avatar.size > 5 * 1024 * 1024) return { error: "사진은 5MB 이하여야 합니다.", success: "" };
  const bytes = new Uint8Array(await avatar.arrayBuffer());
  if (!validAvatar(bytes, avatar.type)) return { error: "JPEG·PNG·WebP 사진을 선택해 주세요.", success: "" };
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[avatar.type];
  path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("avatars").upload(path, bytes, { contentType: avatar.type, upsert: false });
  if (error) return { error: "사진 업로드에 실패했습니다. 다시 시도해 주세요.", success: "" };
 }
 const { error } = await supabase.rpc("update_my_profile", {
  p_birth_year: year, p_region: region, p_gender: gender || null, p_job: job || null,
  p_mbti: mbti || null, p_bio: bio || null, p_avatar_path: path, p_interest_ids: interestIds
 });
 if (error) {
  if (path) await supabase.storage.from("avatars").remove([path]);
  return { error: "프로필을 저장하지 못했습니다. 다시 시도해 주세요.", success: "" };
 }
 if (path && before?.avatar_path && before.avatar_path !== path) await supabase.storage.from("avatars").remove([before.avatar_path]);
 revalidatePath("/profile"); revalidatePath("/members");
 return { error: "", success: "프로필을 저장했습니다." };
}

export async function requestNickname(_previous: { error: string; success: string }, form: FormData): Promise<{ error: string; success: string }> {
 const { supabase } = await requireMember();
 const nickname = String(form.get("nickname") ?? "");
 if (!/^[가-힣A-Za-z0-9_]{2,20}$/.test(nickname)) return { error: "닉네임은 한글·영문·숫자·밑줄 2~20자여야 합니다.", success: "" };
 const { error } = await supabase.rpc("request_nickname_change", { p_nickname: nickname });
 if (error) return { error: error.message.includes("NICKNAME_TAKEN") ? "이미 사용 중인 닉네임입니다." : "변경 신청을 받지 못했습니다. 기존 신청 여부를 확인해 주세요.", success: "" };
 revalidatePath("/profile/edit");
 return { error: "", success: "닉네임 변경을 신청했습니다. 승인 전까지 기존 이름이 표시됩니다." };
}

export async function saveIdealTypes(_previous: { error: string; success: string }, form: FormData): Promise<{ error: string; success: string }> {
 const { supabase } = await requireMember();
 const ids = form.getAll('idealTypeId').map(String);
 if (ids.length > 30 || ids.some(id => !/^[0-9a-f-]{36}$/i.test(id))) return { error: '선택한 항목을 확인해 주세요.', success: '' };
 const { error } = await supabase.rpc('save_my_ideal_types', { p_option_ids: ids });
 if (error) return { error: '이상형 취향을 저장하지 못했습니다. 다시 시도해 주세요.', success: '' };
 revalidatePath('/profile'); revalidatePath('/members');
 return { error: '', success: '이상형 취향을 저장했습니다.' };
}

export async function saveSelfTypes(_previous: { error: string; success: string }, form: FormData): Promise<{ error: string; success: string }> {
 const { supabase } = await requireMember();
 const ids = form.getAll('selfTypeId').map(String);
 if (ids.length > 30 || ids.some(id => !/^[0-9a-f-]{36}$/i.test(id))) return { error: '선택한 항목을 확인해 주세요.', success: '' };
 const { error } = await supabase.rpc('save_my_self_types', { p_option_ids: ids });
 if (error) return { error: '내 스타일을 저장하지 못했습니다. 다시 시도해 주세요.', success: '' };
 revalidatePath('/profile'); revalidatePath('/members');
 return { error: '', success: '내 스타일을 저장했습니다.' };
}
