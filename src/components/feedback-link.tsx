"use client";
import Link from 'next/link';
import {useState,type ReactNode} from 'react';

export function FeedbackLink({href,className,children,current}:{href:string;className?:string;children:ReactNode;current?:boolean}){
 const [pressed,setPressed]=useState(false);
 function acknowledge(){
  setPressed(true);
  window.setTimeout(()=>setPressed(false),650);
 }
 return <Link href={href} className={`feedback-link ${className??''}${pressed?' is-opening':''}`} aria-current={current?'page':undefined} onClick={acknowledge}>{children}</Link>;
}
