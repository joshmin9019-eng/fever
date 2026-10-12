import {NextResponse,type NextRequest} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {isSupabaseConfigured} from "@/lib/supabase/config";
export async function GET(request:NextRequest){
 const code=request.nextUrl.searchParams.get('code');
 const tokenHash=request.nextUrl.searchParams.get('token_hash');
 const type=request.nextUrl.searchParams.get('type');
 if(isSupabaseConfigured()&&(code||(tokenHash&&type==='recovery'))){
  const client=await createClient();
  try{
   const {error}=code?await client.auth.exchangeCodeForSession(code):await client.auth.verifyOtp({token_hash:tokenHash!,type:'recovery'});
   if(!error)return new NextResponse(null,{status:303,headers:{location:'/account/reset-password','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
  }catch{ /* Never log recovery tokens or a full callback URL. */ }
 }
 return new NextResponse(null,{status:303,headers:{location:'/auth/error?reason=recovery','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
