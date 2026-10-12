import Link from "next/link";
export default function Page(){return <section className="placeholder"><h1>연결을 확인해 주세요</h1><p>이메일 인증 링크가 만료되었거나 서비스 연결을 확인해야 합니다.<br/>이메일을 확인하거나 운영자에게 문의해 주세요.</p><Link className="button green" href="/login">로그인으로 돌아가기</Link></section>;}
