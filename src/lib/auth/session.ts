import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { accessDestination, type Role } from "./access";
export async function requireUser() {
 await connection();
 if (!isSupabaseConfigured()) redirect("/login?reason=configuration");
 const supabase = await createClient();
 const { data: { user }, error } = await supabase.auth.getUser();
 if (error || !user) redirect("/login");
 return { supabase, user };
}
export async function requireMember(requirement: Role = "member") {
 const { supabase, user } = await requireUser();
 const { data: profile, error } = await supabase.from("profiles").select("membership_status").eq("id",user.id).maybeSingle();
 if (error) redirect("/auth/error?reason=database");
 const {data: roles, error: roleError} = await supabase.from("user_roles").select("role").eq("user_id",user.id);
 if (roleError) redirect("/auth/error?reason=database");
 const destination = accessDestination(profile?.membership_status ?? null,(roles ?? []).map(item=>item.role),requirement);
 if (destination) redirect(destination);
 return { supabase, user };
}
