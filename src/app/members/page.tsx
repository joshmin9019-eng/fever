import { requireMember } from "@/lib/auth/session";
import { genderClass, genderLabel, ageDecade } from "@/lib/member/display";
import Image from "next/image";
import Link from "next/link";
type Params = Record<string,string|string[]|undefined>;
export default async function Page({searchParams}:{searchParams:Promise<Params>}) {
 const {supabase}=await requireMember();
 const params=await searchParams;
 const value=(key:string)=>typeof params[key]==='string'?params[key] as string:'';
 const q=value('q').trim().slice(0,30);
 const region=value('region').trim().slice(0,100);
 const job=value('job').trim().slice(0,80);
 const mbti=/^[IE][NS][FT][JP]$/.test(value('mbti'))?value('mbti'):'';
 const gender=['male','female'].includes(value('gender'))?value('gender'):'';
 const decade=/^(10|20|30|40|50|60|70|80|90)$/.test(value('decade'))?Number(value('decade')):0;
 const [{data:interests},interestMembers]=await Promise.all([
  supabase.from('interests').select('id,label').eq('is_active',true).order('sort_order'),
  /^[0-9a-f-]{36}$/i.test(value('interest'))?supabase.from('profile_interests').select('user_id').eq('interest_id',value('interest')):Promise.resolve({data:null,error:null})
 ]);
 let query=supabase.from('profiles').select('id,nickname,birth_year,region,gender,job,mbti,bio,avatar_path,joined_at').eq('membership_status','active').order('joined_at',{ascending:false}).limit(50);
 if(q)query=query.ilike('nickname',`%${q.replace(/[%_\\]/g,'\\$&')}%`);
 if(region)query=query.ilike('region',`%${region.replace(/[%_\\]/g,'\\$&')}%`);
 if(job)query=query.ilike('job',`%${job.replace(/[%_\\]/g,'\\$&')}%`);
 if(mbti)query=query.eq('mbti',mbti);
 if(gender)query=query.eq('gender',gender);
 if(decade){const year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Asia/Seoul'}).format(new Date()));query=query.gte('birth_year',year-(decade+9)+1).lte('birth_year',year-decade+1);}
 if(value('interest')&&interestMembers.data){const ids=interestMembers.data.map(row=>row.user_id);if(!ids.length)return <section className="content-section"><h1>회원 찾기</h1><p>조건에 맞는 회원이 없습니다.</p><Link className="text-link" href="/members">필터 초기화</Link></section>;query=query.in('id',ids);}
 const {data,error}=await query;
 if(error)return <section className="placeholder"><h1>회원 찾기</h1><p role="alert">목록을 불러오지 못했습니다. 새 데이터베이스 설정을 확인해 주세요.</p></section>;
 const members=await Promise.all((data??[]).map(async member=>({member,photo:member.avatar_path?(await supabase.storage.from('avatars').createSignedUrl(member.avatar_path,60)).data?.signedUrl:null})));
 return <section className="content-section"><span className="eyebrow dark">FEVER MEMBERS</span><h1>함께하는 사람들</h1><p>승인된 회원의 이야기를 찾아보세요.</p>
  <form className="member-filters" action="/members"><input name="q" aria-label="닉네임 검색" placeholder="닉네임 검색" defaultValue={q}/><input name="region" aria-label="거주지역" placeholder="거주지역" defaultValue={region}/><input name="job" aria-label="직업" placeholder="직업" defaultValue={job}/><select name="decade" aria-label="나이대" defaultValue={value('decade')}><option value="">모든 나이대</option>{[10,20,30,40,50,60,70,80,90].map(value=><option key={value} value={value}>{value}대</option>)}</select><select name="gender" aria-label="성별" defaultValue={gender}><option value="">모든 성별</option><option value="male">남</option><option value="female">여</option></select><select name="mbti" aria-label="MBTI" defaultValue={mbti}><option value="">모든 MBTI</option>{['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'].map(value=><option key={value} value={value}>{value}</option>)}</select><select name="interest" aria-label="관심사" defaultValue={value('interest')}><option value="">모든 관심사</option>{interests?.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><button className="button green">찾기</button><Link className="text-link" href="/members">초기화</Link></form>
  <div className="member-grid">{members.map(({member,photo})=><Link className={`member-card ${genderClass(member.gender)}`} href={`/members/${member.id}`} key={member.id}>{photo?<Image unoptimized src={photo} alt={`${member.nickname} 프로필 사진`} width={66} height={66}/>:<div className="avatar-fallback"/>}<div><strong>{member.nickname}</strong><span className={`gender-badge ${genderClass(member.gender)}`}>{genderLabel(member.gender)}</span><p>{ageDecade(member.birth_year)} · {member.region}</p>{member.job&&<small>{member.job}</small>}</div></Link>)}</div>
  {!members.length&&<div className="notice">조건에 맞는 회원이 없습니다.</div>}{members.length===50&&<p className="list-hint">최근 가입한 회원 50명까지 표시합니다. 검색 조건을 좁혀 주세요.</p>}
 </section>;
}
