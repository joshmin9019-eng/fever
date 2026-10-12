import Link from "next/link";
export default function Page(){return <section className="placeholder"><h1>가입 신청을 이어가 주세요</h1><p>현재는 별도 이메일 인증 없이 가입정보를 입력합니다.<br/>이미 계정을 만들었다면 로그인 후 사진과 프로필을 입력해 주세요.</p><Link className="button green" href="/login">로그인으로 이동</Link></section>;}
