import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { ArrowUpRight, UserRound, ArrowRight, CalendarCheck, MessageCircle, Sparkles, Search, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {dailyQuestionIndex,koreaToday} from "@/lib/questions/daily";
import {FeedbackLink} from '@/components/feedback-link';
import {genderClass} from '@/lib/member/display';
type Member = { id: string; nickname: string | null; bio: string | null; avatar_path: string | null; membership_status: string; gender:string|null };
type DailyQuestion = {id:string;title:string;type:string};
type BirthdayMember = {user_id:string;nickname:string;birth_day:number;gender:string|null};
export default async function Home() {
 await connection();
 let profile: Member | null = null;
 let photo: string | null = null;
 let questionCount = 0;
 let answeredCount:number|null=null;
 let dailyQuestion:DailyQuestion|null=null;
 let checkedIn=false;
 let answeredDailyQuestion=false;
 let attendanceReady=true;
 let birthdayMembers:BirthdayMember[]=[];
 const today=koreaToday();
 if (isSupabaseConfigured()) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
   const { data } = await supabase.from('profiles').select('id,nickname,bio,avatar_path,membership_status,gender').eq('id',user.id).maybeSingle();
   profile = data;
   if (profile?.membership_status === 'active') {
    const {data:birthdays}=await supabase.rpc('month_birthdays',{p_month:Number(today.slice(5,7))});
    birthdayMembers=birthdays??[];
    const {data:questions}=await supabase.from('questions').select('id,title,type,question_categories!inner(is_active)').eq('is_active',true).eq('question_categories.is_active',true).order('id');
    questionCount=questions?.length??0;
    dailyQuestion=questions?.[dailyQuestionIndex(today,questionCount)]??null;
    if(dailyQuestion){
     const [{data:checkIn,error:attendanceError},{count:myAnswerCount,error:answerCountError}]=await Promise.all([
      supabase.from('daily_attendance').select('question_id').eq('user_id',user.id).eq('attendance_date',today).maybeSingle(),
      supabase.from('answers').select('id',{head:true,count:'exact'}).eq('user_id',user.id).in('question_id',questions?.map(item=>item.id)??[]).is('deleted_at',null).is('hidden_at',null)
     ]);
     if(!answerCountError)answeredCount=myAnswerCount??0;
     attendanceReady=!attendanceError;
     checkedIn=!!checkIn;
     answeredDailyQuestion=checkIn?.question_id===dailyQuestion.id;
    }
    if (profile.avatar_path) photo=(await supabase.storage.from('avatars').createSignedUrl(profile.avatar_path,60)).data?.signedUrl??null;
   }
  }
 }
 const active=profile?.membership_status==='active';
 return <div className="home-page">
  {active&&<section className={`home-identity ${genderClass(profile?.gender)}`} aria-label="내 소개"><FeedbackLink href="/profile" className="identity-main"><div className="identity-avatar">{photo?<Image unoptimized src={photo} alt="" width={78} height={78}/>:<UserRound size={37}/>}</div><div><small>나의 프로필</small><h2 className="member-name-ring">{profile?.nickname}</h2><p>{profile?.bio||'자기소개를 채워 나를 더 잘 보여주세요.'}</p>{!profile?.gender&&<span className="gender-setup-link">성별 표시를 선택하면 이름에 색상이 들어가요 →</span>}</div></FeedbackLink><FeedbackLink href="/profile/edit" className="identity-edit">소개 수정 <ArrowRight size={15}/></FeedbackLink></section>}
  {active?<section className="daily-home" aria-labelledby="daily-title"><div className="daily-home-top"><span className="eyebrow">TODAY IN FEVER · {today}</span><span className="daily-status"><CalendarCheck size={17}/>{dailyQuestion?(attendanceReady?(checkedIn?'오늘 출석 완료':'오늘 출석 전'):'출석 기록 준비 중'):'질문 준비 중'}</span></div><h1 id="daily-title">오늘의 질문</h1>{dailyQuestion?<><p className="daily-question-title">{dailyQuestion.title}</p><p className="daily-home-hint">{!attendanceReady?'출석 기록 연결을 준비하고 있어요. 질문에는 지금 답할 수 있습니다.':answeredDailyQuestion?'오늘의 답변을 남겼어요. 다른 회원의 이야기도 살펴보세요.':'이 질문에 답변을 저장하면 오늘 출석이 자동으로 기록됩니다.'}</p><FeedbackLink className="button light" href={`/questions/${dailyQuestion.id}`}>{!attendanceReady?'오늘의 질문에 답하기':answeredDailyQuestion?'오늘의 답변 보기':checkedIn?'오늘의 질문 보기':'답하고 출석하기'} <ArrowRight size={16}/></FeedbackLink></>:<><p className="daily-home-hint">등록된 질문이 없습니다. 관리자가 질문을 등록하면 매일 하나씩 보여드려요.</p><FeedbackLink className="button light" href="/questions">질문 목록 <ArrowRight size={16}/></FeedbackLink></>}</section>:<section className="home-welcome guest-welcome"><div className="home-welcome-copy"><span className="eyebrow">PEOPLE · TALK · MEET</span><h1>내 이야기가<br/>우리를 <em>가깝게.</em></h1><p>서로의 이야기에서 관심과 호감이 시작되는 곳, FEVER.</p><Link className="button light" href={profile?'/pending':'/signup'}>{profile?'가입 상태 확인':'FEVER 함께하기'} <ArrowUpRight size={17}/></Link></div></section>}
  {active&&<section className="home-menu" aria-label="더 둘러보기"><div className="home-menu-grid">
   <FeedbackLink href="/questions" className="home-menu-card"><span className="home-menu-icon"><MessageCircle/></span><strong>내 답변 채우기</strong><small>{answeredCount===null?'질문으로 나를 소개하기':`답변 ${answeredCount} / 전체 ${questionCount}개`}</small><ArrowUpRight className="home-menu-arrow" size={18}/></FeedbackLink>
   <FeedbackLink href="/discover" className="home-menu-card"><span className="home-menu-icon"><Sparkles/></span><strong>대화 발견</strong><small>다른 회원의 이야기 보기</small><ArrowUpRight className="home-menu-arrow" size={18}/></FeedbackLink>
   <FeedbackLink href="/members" className="home-menu-card"><span className="home-menu-icon"><Search/></span><strong>회원 찾기</strong><small>서로 취향이 맞는 회원 찾기</small><ArrowUpRight className="home-menu-arrow" size={18}/></FeedbackLink>
   <FeedbackLink href="/fortune" className="home-menu-card"><span className="home-menu-icon"><Sun/></span><strong>오늘의 운세</strong><small>나의 별자리 운세 보기</small><ArrowUpRight className="home-menu-arrow" size={18}/></FeedbackLink>
  </div></section>}
  {active&&<section className="birthday-section"><div><span className="eyebrow dark">BIRTHDAYS THIS MONTH</span><h2>{Number(today.slice(5,7))}월의 생일자 🎂</h2></div>{birthdayMembers.length?<div className="birthday-list">{birthdayMembers.map(member=><FeedbackLink href={`/members/${member.user_id}`} className={`birthday-person ${genderClass(member.gender)}`} key={member.user_id}><strong>{member.nickname}</strong><span>{Number(today.slice(5,7))}월 {member.birth_day}일</span></FeedbackLink>)}</div>:<p>이번 달 생일자가 아직 없어요.</p>}<FeedbackLink className="text-link" href="/fortune">내 생일 확인 →</FeedbackLink></section>}
 </div>;
}
