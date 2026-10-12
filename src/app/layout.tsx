import type { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { HeaderAccount } from "@/components/header-account";
import "./globals.css";
export const metadata: Metadata = { title: "FEVER · 우리 사이, 더 가까이", description: "함께 만나고, 서로를 알아가는 FEVER 소모임" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="ko"><body><a className="skip" href="#main">본문으로 건너뛰기</a><div className="app-shell"><header><Link className="wordmark" href="/" aria-label="FEVER 홈">fever<span>✳</span></Link><HeaderAccount/></header><main id="main">{children}</main><Navigation/></div></body></html>; }
