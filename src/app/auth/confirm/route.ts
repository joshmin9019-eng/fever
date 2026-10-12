import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export async function GET(request: NextRequest) {
 const tokenHash=request.nextUrl.searchParams.get("token_hash");
 const type=request.nextUrl.searchParams.get("type");
 if (tokenHash && type === "signup" && isSupabaseConfigured()) {
  const client=await createClient();
  const {error}=await client.auth.verifyOtp({token_hash:tokenHash,type:"signup"});
  if (!error) return new NextResponse(null,{status:303,headers:{location:"/pending"}});
 }
 return new NextResponse(null,{status:303,headers:{location:"/auth/error"}});
}
