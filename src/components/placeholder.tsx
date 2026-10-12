import Link from "next/link";
import { ArrowLeft, Sprout } from "lucide-react";
export function Placeholder({title,description,admin=false}:{title:string;description:string;admin?:boolean}) { return <section className="placeholder"><span className="eyebrow dark">{admin?"ADMINISTRATION":"COMING NEXT"}</span><Sprout size={42}/><h1>{title}</h1><p>{description}</p><div className="notice">{admin?"이 운영 기능은 준비 중입니다. 현재 화면에서는 운영 데이터를 조회하거나 변경하지 않습니다.":"이 기능은 후속 개발 단계입니다. 현재 화면에서는 회원 정보를 조회하거나 변경하지 않습니다."}</div><Link href="/" className="button green"><ArrowLeft size={18}/> 홈으로 돌아가기</Link></section>; }
