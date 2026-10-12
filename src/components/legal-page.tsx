import Link from "next/link";
import { LEGAL_VERSION } from "@/lib/legal-content";
export function LegalPage({title,sections}:{title:string;sections:{title:string;text:string}[]}){
 return <article className="legal-page"><span className="eyebrow dark">FEVER COMMUNITY</span><h1>{title}</h1><p className="legal-version">적용 버전: {LEGAL_VERSION} · 운영자: FEVER 운영팀</p>{sections.map(section=><section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}<p className="notice">현재 제공 기능과 확정 운영 정책을 바탕으로 작성한 기본 안내입니다. 정식 운영 전에는 운영자 연락처, 서비스 제공 업체의 처리 지역 및 법령상 필요한 추가 고지 사항을 확인해 보완합니다.</p><Link className="button green" href="/signup">가입 화면으로 이동</Link></article>;
}
