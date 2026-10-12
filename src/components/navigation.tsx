"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, CalendarDays, UserRound } from "lucide-react";
const items = [{href:"/",label:"홈",Icon:Home},{href:"/members",label:"모임",Icon:Users},{href:"/events",label:"벙",Icon:CalendarDays},{href:"/profile",label:"MY",Icon:UserRound}];
export function Navigation() { const path=usePathname(); return <nav className="bottom-nav" aria-label="주요 메뉴">{items.map(({href,label,Icon})=><Link key={href} href={href} aria-current={(href==="/"?path===href:path.startsWith(href))?"page":undefined}><Icon size={21}/><span>{label}</span></Link>)}</nav>; }
