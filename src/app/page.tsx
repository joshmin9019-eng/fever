import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { ArrowUpRight, Users, MessageCircle, CalendarDays, UserRound, Search, ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
type Member = { id: string; nickname: string | null; bio: string | null; avatar_path: string | null; membership_status: string };
export default async function Home() {
 await connection();
 let profile: Member | null = null;
 let photo: string | null = null;
 let answered = 0;
 let questionCount = 0;
 if (isSupabaseConfigured()) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
   const { data } = await supabase.from('profiles').select('id,nickname,bio,avatar_path,membership_status').eq('id',user.id).maybeSingle();
   profile = data;
   if (profile?.membership_status === 'active') {
    const [{count:myCount},{count:totalCount}] = await Promise.all([
     supabase.from('answers').select('id',{count:'exact',head:true}).eq('user_id',user.id).is('deleted_at',null).is('hidden_at',null),
     supabase.from('questions').select('id',{count:'exact',head:true}).eq('is_active',true)
    ]);
    answered = myCount ?? 0;questionCount=totalCount ?? 0;
    if (profile.avatar_path) photo=(await supabase.storage.from('avatars').createSignedUrl(profile.avatar_path,60)).data?.signedUrl??null;
   }
  }
 }
 const active=profile?.membership_status==='active';
 return <div className="home-page">
  <section className="home-welcome"><div className="home-welcome-copy"><span className="eyebrow">PEOPLE · TALK · MEET</span><h1>{active?<>{profile?.nickname}님,<br/>오늘은 어떤 이야기를<br/><em>나눠볼까요?</em></>:<>내 이야기가<br/>우리를 <em>가깝게.</em></>}</h1><p>{active?'나를 소개하고, 다른 회원의 이야기도 발견해 보세요.':'서로의 프로필과 답변을 통해 만남 전에 조금 더 가까워지는 곳, FEVER.'}</p>{!active&&<Link className="button light" href={profile?'/pending':'/signup'}>{profile?'가입 상태 확인':'FEVER 함께하기'} <ArrowUpRight size={17}/></Link>}</div><div className="home-welcome-art" aria-hidden="true"><span>F</span><i>✳</i></div></section>
  {active&&<section className="home-identity" aria-label="내 소개"><div className="identity-avatar">{photo?<Image unoptimized src={photo} alt="" width={78} height={78}/>:<UserRound size={37}/>}</div><div><small>MY FEVER</small><h2>{profile?.nickname}</h2><p>{profile?.bio||'자기소개를 채워 나를 더 잘 보여주세요.'}</p></div><Link href="/profile/edit" className="identity-edit">수정 <ArrowRight size={15}/></Link></section>}
  <section className="home-menu" aria-labelledby="home-menu-title"><div className="section-heading"><div><span className="eyebrow dark">DISCOVER FEVER</span><h2 id="home-menu-title">어디서부터 시작할까요?</h2></div></div><div className="home-menu-grid">
   <Link href="/profile" className="home-menu-card"><span className="home-menu-icon"><UserRound/></span><strong>내 프로필</strong><small>나를 소개하고 보여주기</small><ArrowUpRight className="home-menu-arrow" size={18}/></Link>
   <Link href="/members" className="home-menu-card"><span className="home-menu-icon"><Users/></span><strong>우리 모임</strong><small>함께하는 사람들 만나기</small><ArrowUpRight className="home-menu-arrow" size={18}/></Link>
   <Link href="/questions" className="home-menu-card"><span className="home-menu-icon"><MessageCircle/></span><strong>질문 답변</strong><small>나의 생각을 하나씩 쌓기</small><ArrowUpRight className="home-menu-arrow" size={18}/></Link>
   <Link href="/members" className="home-menu-card"><span className="home-menu-icon"><Search/></span><strong>회원 찾기</strong><small>관심사가 맞는 사람 찾기</small><ArrowUpRight className="home-menu-arrow" size={18}/></Link>
  </div></section>
  <section className="home-story"><div className="home-story-mark"><Sparkles size={24}/></div><div><span className="eyebrow dark">MY STORIES</span><h2>내 이야기를 채워 보세요</h2><p>{active?('현재 '+answered+'개의 답변을 남겼어요'+(questionCount?' · 전체 '+questionCount+'개 질문':'' )+'.'):'질문에 답할수록 나를 소개하는 페이지가 풍성해져요.'}</p></div><Link className="button green" href="/questions">질문 보기 <ArrowRight size={16}/></Link></section>
  <section className="home-event-note"><CalendarDays size={22}/><div><h2>우리의 만남</h2><p>벙 참여 기능은 다음 단계에서 준비합니다.</p></div><Link className="text-link" href="/events">둘러보기 <ArrowRight size={16}/></Link></section>
 </div>;
}
