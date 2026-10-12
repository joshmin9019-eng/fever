import { requireMember } from "@/lib/auth/session";
export default async function Layout({children}:{children:React.ReactNode}){await requireMember("admin");return <>{children}</>;}
