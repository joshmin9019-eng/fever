"use client";
import { useActionState } from "react";
import { saveProfile, requestNickname, saveIdealTypes, saveSelfTypes } from "@/app/profile/edit/actions";

type Profile = { nickname: string | null; birth_year: number | null; region: string | null; gender: string | null; job: string | null; mbti: string | null; bio: string | null };
type Interest = { id: string; label: string };
type IdealOption = { id: string; category: string; label: string };
const mbtiValues = ["", "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
export function ProfileEditForms({ profile, interests, selected, pendingName, idealOptions, selectedIdealTypes, selectedSelfTypes }: { profile: Profile; interests: Interest[]; selected: string[]; pendingName?: string; idealOptions: IdealOption[]; selectedIdealTypes: string[]; selectedSelfTypes: string[] }) {
 const [state, action, pending] = useActionState(saveProfile, { error: "", success: "" });
 const [nameState, nameAction, namePending] = useActionState(requestNickname, { error: "", success: "" });
 const [idealState, idealAction, idealPending] = useActionState(saveIdealTypes, { error: "", success: "" });
 const [selfState, selfAction, selfPending] = useActionState(saveSelfTypes, { error: "", success: "" });
 return <div className="profile-edit-grid">
  <form action={action} className="auth-form profile-form">
   <h2>기본 정보</h2>
   <label htmlFor="birthYear">출생연도</label><input id="birthYear" name="birthYear" type="number" min="1" required defaultValue={profile.birth_year ?? ""}/>
   <label htmlFor="region">거주지역</label><input id="region" name="region" required maxLength={100} defaultValue={profile.region ?? ""}/>
   <label htmlFor="gender">성별 표시</label><select id="gender" name="gender" defaultValue={profile.gender ?? ""}><option value="">표시하지 않음</option><option value="male">남</option><option value="female">여</option></select>
   <small>남·여는 회원 카드에서 서로 다른 색으로 표시됩니다.</small>
   <label htmlFor="job">직업</label><input id="job" name="job" maxLength={80} defaultValue={profile.job ?? ""}/>
   <label htmlFor="mbti">MBTI</label><select id="mbti" name="mbti" defaultValue={profile.mbti ?? ""}>{mbtiValues.map(value=><option key={value} value={value}>{value || "선택 안 함"}</option>)}</select>
   <label htmlFor="bio">자기소개</label><textarea id="bio" name="bio" maxLength={500} defaultValue={profile.bio ?? ""}/>
   <label htmlFor="avatar">프로필 사진 변경</label><input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp"/><small>선택하지 않으면 현재 사진이 유지됩니다. 최대 5MB.</small>
   <fieldset className="interest-field"><legend>관심사</legend><div className="interest-options">{interests.map(item=><label key={item.id}><input name="interestId" type="checkbox" value={item.id} defaultChecked={selected.includes(item.id)}/>{item.label}</label>)}</div></fieldset>
   {state.error&&<p className="form-error" role="alert">{state.error}</p>}{state.success&&<p className="notice" role="status">{state.success}</p>}
   <button className="button green" disabled={pending}>프로필 저장</button>
  </form>
  <div className="profile-side-forms"><form action={selfAction} className="auth-form profile-form ideal-form"><span className="eyebrow dark">ABOUT ME</span><h2>나를 나타내는 스타일</h2><p>내 분위기와 성향·성격을 골라 주세요. 승인된 회원과 관리자에게 표시됩니다.</p>
   {['분위기','체형','성향','성격'].map(category=><fieldset className="interest-field" key={category}><legend>{category}</legend><div className="interest-options">{idealOptions.filter(item=>item.category===category).map(item=><label key={item.id}><input name="selfTypeId" type="checkbox" value={item.id} defaultChecked={selectedSelfTypes.includes(item.id)}/>{item.label}</label>)}</div></fieldset>)}
   {selfState.error&&<p className="form-error" role="alert">{selfState.error}</p>}{selfState.success&&<p className="notice" role="status">{selfState.success}</p>}
   <button className="button green" disabled={selfPending}>내 스타일 저장</button>
  </form><form action={idealAction} className="auth-form profile-form ideal-form"><span className="eyebrow dark">IDEAL TYPE</span><h2>내가 끌리는 스타일</h2><p>마음이 가는 분위기와 성격을 골라 주세요. 승인된 회원에게 공개됩니다.</p>
   {['분위기','체형','성향','성격'].map(category=><fieldset className="interest-field" key={category}><legend>{category}</legend><div className="interest-options">{idealOptions.filter(item=>item.category===category).map(item=><label key={item.id}><input name="idealTypeId" type="checkbox" value={item.id} defaultChecked={selectedIdealTypes.includes(item.id)}/>{item.label}</label>)}</div></fieldset>)}
   {idealState.error&&<p className="form-error" role="alert">{idealState.error}</p>}{idealState.success&&<p className="notice" role="status">{idealState.success}</p>}
   <button className="button green" disabled={idealPending}>이상형 취향 저장</button>
  </form><form action={nameAction} className="auth-form profile-form">
   <h2>닉네임 변경</h2><p>현재 닉네임: <strong>{profile.nickname}</strong></p>
   {pendingName&&<p className="notice">{pendingName} 변경 요청이 승인 대기 중입니다.</p>}
   <label htmlFor="nickname">새 닉네임</label><input id="nickname" name="nickname" minLength={2} maxLength={20} pattern="[가-힣A-Za-z0-9_]{2,20}" required disabled={!!pendingName}/>
   {nameState.error&&<p className="form-error" role="alert">{nameState.error}</p>}{nameState.success&&<p className="notice" role="status">{nameState.success}</p>}
   <button className="button green" disabled={namePending||!!pendingName}>변경 승인 요청</button>
  </form></div>
 </div>;
}
