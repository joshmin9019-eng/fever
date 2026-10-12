import Link from "next/link";
import {requireUser} from "@/lib/auth/session";
const statusLabels:Record<string,string>={pending_email:"가입정보 미완료",pending_approval:"가입 승인 대기",active:"승인 완료",rejected:"가입 반려",suspended:"이용 정지",withdrawal_requested:"탈퇴 요청",deleted:"탈퇴 처리"};
const roleLabels:Record<string,string>={member:"회원",admin:"관리자",super_admin:"최고관리자"};
export default async function Page(){
 const {supabase,user}=await requireUser();
 const {data:profile,error:profileError}=await supabase.from('profiles').select('membership_status').eq('id',user.id).maybeSingle();
 const {data:roles,error:roleError}=await supabase.from('user_roles').select('role').eq('user_id',user.id);
 const isAdmin=profile?.membership_status==='active'&&roles?.some(item=>['admin','super_admin'].includes(item.role));
 return <section className="auth-section"><span className="eyebrow dark">MY ACCOUNT</span><h1>현재 로그인 계정</h1><p>가입 신청과 관리자 설정에 사용한 계정이 같은지 확인해 주세요.</p><dl className="account-status"><dt>로그인 이메일</dt><dd>{user.email??'확인 불가'}</dd><dt>계정 UID</dt><dd><code>{user.id}</code></dd><dt>가입 상태</dt><dd>{profileError?'불러오지 못했습니다':profile?statusLabels[profile.membership_status]??'알 수 없는 상태':'가입 정보가 없습니다'}</dd><dt>등록된 권한</dt><dd>{roleError?'불러오지 못했습니다':roles?.length?roles.map(item=>roleLabels[item.role]??item.role).join(', '):'등록된 권한 없음'}</dd></dl>{isAdmin?<Link className="button green" href="/admin/members">회원 가입 관리</Link>:<Link className="button green" href="/pending">가입 상태로 돌아가기</Link>}</section>;
}
