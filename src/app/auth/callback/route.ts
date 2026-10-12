import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export async function GET(request: NextRequest) {
 const code = request.nextUrl.searchParams.get("code");
 if (code && isSupabaseConfigured()) {
  const client=await createClient();
  const {error}=await client.auth.exchangeCodeForSession(code);
  if (!error) return new NextResponse(null,{status:303,headers:{location:"/profile"}});
 }
 return new NextResponse(null,{status:303,headers:{location:"/auth/error"}});
}
