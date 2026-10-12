"use client";
import { usePathname } from "next/navigation";
import { Home, Users, MessageCircle, UserRound } from "lucide-react";
import {FeedbackLink} from './feedback-link';
const items = [{href:"/",label:"홈",Icon:Home},{href:"/members",label:"회원",Icon:Users},{href:"/discover",label:"대화",Icon:MessageCircle},{href:"/profile",label:"MY",Icon:UserRound}];
export function Navigation() { const path=usePathname(); return <nav className="bottom-nav" aria-label="주요 메뉴">{items.map(({href,label,Icon})=><FeedbackLink key={href} href={href} current={href==="/"?path===href:path.startsWith(href)}><Icon size={21}/><span>{label}</span></FeedbackLink>)}</nav>; }
