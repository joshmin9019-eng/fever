import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";
export async function proxy(request: NextRequest) {
 if (!isSupabaseConfigured()) return NextResponse.next();
 let response = NextResponse.next({request});
 const {url,key} = getSupabaseConfig();
 const client = createServerClient(url,key,{cookies:{
  getAll:()=>request.cookies.getAll(),
  setAll:(items)=>{items.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});items.forEach(({name,value,options})=>response.cookies.set(name,value,options));}
 }});
 // Refresh session only. Server guards and RLS must independently enforce access.
 await client.auth.getUser();
 return response;
}
export const config = {matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]};
