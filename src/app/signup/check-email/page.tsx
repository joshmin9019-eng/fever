import Link from "next/link";
export default function Page(){return <section className="placeholder"><h1>이메일을 확인해 주세요</h1><p>입력한 주소가 가입 가능한 경우 인증 메일이 전송됩니다.<br/>인증 후 사진과 프로필을 입력해 가입 신청을 완료해 주세요.<br/>이미 가입한 주소라면 로그인해 주세요.</p><Link className="button green" href="/login">로그인으로 이동</Link></section>;}
