import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { ArrowUpRight, UserRound, ArrowRight, CalendarCheck, MessageCircle, Sparkles, Search, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {dailyQuestionIndex,koreaToday} from "@/lib/questions/daily";
type Member = { id: string; nickname: string | null; bio: string | null; avatar_path: string | null; membership_status: string };
type DailyQuestion = {id:string;title:string;type:string};
export default async function Home() {
 await connection();
 let profile: Member | null = null;
 let photo: string | null = null;
 let questionCount = 0;
 let dailyQuestion:DailyQuestion|null=null;
 let checkedIn=false;
 let answeredDailyQuestion=false;
 let attendanceReady=true;
 let dailyAnswer:{nickname:string;text:string}|null=null;
 const today=koreaToday();
 if (isSupabaseConfigured()) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
   const { data } = await supabase.from('profiles').select('id,nickname,bio,avatar_path,membership_status').eq('id',user.id).maybeSingle();
   profile = data;
   if (profile?.membership_status === 'active') {
    const {data:questions}=await supabase.from('questions').select('id,title,type,question_categories!inner(is_active)').eq('is_active',true).eq('question_categories.is_active',true).order('id');
    questionCount=questions?.length??0;
    dailyQuestion=questions?.[dailyQuestionIndex(today,questionCount)]??null;
    if(dailyQuestion){
     const [{data:checkIn,error:attendanceError},{data:recentAnswer}]=await Promise.all([
      supabase.from('daily_attendance').select('question_id').eq('user_id',user.id).eq('attendance_date',today).maybeSingle(),
      supabase.from('answers').select('user_id,text_value,question_options(label),profiles!inner(nickname,membership_status)').eq('question_id',dailyQuestion.id).neq('user_id',user.id).eq('profiles.membership_status','active').is('deleted_at',null).is('hidden_at',null).gte('updated_at',new Date(`${today}T00:00:00+09:00`).toISOString()).order('updated_at',{ascending:false}).limit(1).maybeSingle()
     ]);
     attendanceReady=!attendanceError;
     checkedIn=!!checkIn;
     answeredDailyQuestion=checkIn?.question_id===dailyQuestion.id;
     if(recentAnswer){const person=Array.isArray(recentAnswer.profiles)?recentAnswer.profiles[0]:recentAnswer.profiles;const option=Array.isArray(recentAnswer.question_options)?recentAnswer.question_options[0]:recentAnswer.question_options;dailyAnswer={nickname:person?.nickname??'회원',text:recentAnswer.text_value??option?.label??''};}
    }
    if (profile.avatar_path) photo=(await supabase.storage.from('avatars').createSignedUrl(profile.avatar_path,60)).data?.signedUrl??null;
   }
  }
 }
 const active=profile?.membership_status==='active';
 return <div className="home-page">
  {active&&<section className="home-identity" aria-label="내 소개"><div className="identity-avatar">{photo?<Image unoptimized src={photo} alt="" width={78} height={78}/>:<UserRound size={37}/>}</div><div><small>나의 프로필</small><h2>{profile?.nickname}</h2><p>{profile?.bio||'자기소개를 채워 나를 더 잘 보여주세요.'}</p></div><Link href="/profile/edit" className="identity-edit">소개 수정 <ArrowRight size={15}/></Link></section>}
  {active?<section className="daily-home" aria-labelledby="daily-title"><div className="daily-home-top"><span className="eyebrow">TODAY IN FEVER · {today}</span><span className="daily-status"><CalendarCheck size={17}/>{dailyQuestion?(attendanceReady?(checkedIn?'오늘 출석 완료':'오늘 출석 전'):'출석 기록 준비 중'):'질문 준비 중'}</span></div><h1 id="daily-title">오늘의 질문</h1>{dailyQuestion?<><p className="daily-question-title">{dailyQuestion.title}</p><p className="daily-home-hint">{!attendanceReady?'출석 기록 연결을 준비하고 있어요. 질문에는 지금 답할 수 있습니다.':answeredDailyQuestion?'오늘의 답변을 남겼어요. 다른 회원의 이야기도 살펴보세요.':'이 질문에 답변을 저장하면 오늘 출석이 자동으로 기록됩니다.'}</p><Link className="button light" href={`/questions/${dailyQuestion.id}`}>{!attendanceReady?'오늘의 질문에 답하기':answeredDailyQuestion?'오늘의 답변 보기':checkedIn?'오늘의 질문 보기':'답하고 출석하기'} <ArrowRight size={16}/></Link></>:<><p className="daily-home-hint">등록된 질문이 없습니다. 관리자가 질문을 등록하면 매일 하나씩 보여드려요.</p><Link className="button light" href="/questions">질문 목록 <ArrowRight size={16}/></Link></>}</section>:<section className="home-welcome guest-welcome"><div className="home-welcome-copy"><span className="eyebrow">PEOPLE · TALK · MEET</span><h1>내 이야기가<br/>우리를 <em>가깝게.</em></h1><p>서로의 이야기에서 관심과 호감이 시작되는 곳, FEVER.</p><Link className="button light" href={profile?'/pending':'/signup'}>{profile?'가입 상태 확인':'FEVER 함께하기'} <ArrowUpRight size={17}/></Link></div></section>}
  {active&&<section className="home-menu" aria-label="더 둘러보기"><div className="home-menu-grid">
   <Link href="/questions" className="home-menu-card"><span className="home-menu-icon"><MessageCircle/></span><strong>내 답변 채우기</strong><small>질문으로 나를 소개하기</small><ArrowUpRight className="home-menu-arrow" size={18}/></Link>
   <Link href="/discover" className="home-menu-card"><span className="home-menu-icon"><Sparkles/></span><strong>대화 발견</strong><small>다른 회원의 이야기 보기</small><ArrowUpRight className="home-menu-arrow" size={18}/></Link>
   <Link href="/members" className="home-menu-card"><span className="home-menu-icon"><Search/></span><strong>회원 찾기</strong><small>서로 취향이 맞는 회원 찾기</small><ArrowUpRight className="home-menu-arrow" size={18}/></Link>
   <Link href="/fortune" className="home-menu-card"><span className="home-menu-icon"><Sun/></span><strong>오늘의 운세</strong><small>나의 별자리 운세 보기</small><ArrowUpRight className="home-menu-arrow" size={18}/></Link>
  </div></section>}
  {active&&dailyQuestion&&<section className="today-answer"><div><span className="eyebrow dark">TODAY’S ANSWER</span><h2>오늘의 답변</h2></div>{dailyAnswer?<p><strong>{dailyAnswer.nickname}</strong>님의 이야기 · {dailyAnswer.text}</p>:<p>아직 오늘 공개된 다른 회원의 답변이 없어요. 첫 이야기를 남겨 보세요.</p>}<Link className="text-link" href={`/questions/${dailyQuestion.id}`}>답변 살펴보기 <ArrowRight size={15}/></Link></section>}
 </div>;
}
