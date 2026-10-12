"use client";
import Link, {useLinkStatus} from 'next/link';
import {useState,type ReactNode} from 'react';

function PendingHint(){
 const {pending}=useLinkStatus();
 return <span className={`menu-pending-hint${pending?' is-visible':''}`} aria-live="polite">{pending?'여는 중…':''}</span>;
}

export function FeedbackLink({href,className,children,current}:{href:string;className?:string;children:ReactNode;current?:boolean}){
 const [pressed,setPressed]=useState(false);
 function acknowledge(){
  setPressed(true);
  window.setTimeout(()=>setPressed(false),650);
 }
 return <Link href={href} className={`${className??''}${pressed?' is-opening':''}`} aria-current={current?'page':undefined} onClick={acknowledge}>{children}<PendingHint/></Link>;
}
