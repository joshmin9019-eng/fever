import { requireMember } from "@/lib/auth/session";
import { genderClass, ageDecade } from "@/lib/member/display";
import Image from "next/image";
import Link from "next/link";
type Params = Record<string,string|string[]|undefined>;
export default async function Page({searchParams}:{searchParams:Promise<Params>}) {
 const {supabase,user}=await requireMember();
 const params=await searchParams;
 const value=(key:string)=>typeof params[key]==='string'?params[key] as string:'';
 const q=value('q').trim().slice(0,30);
 const region=value('region').trim().slice(0,100);
 const job=value('job').trim().slice(0,80);
 const mbti=/^[IE][NS][FT][JP]$/.test(value('mbti'))?value('mbti'):'';
 const gender=['male','female'].includes(value('gender'))?value('gender'):'';
 const style=/^[0-9a-f-]{36}$/i.test(value('style'))?value('style'):'';
 const mutual=value('mutual')==='1';
 const decade=/^(10|20|30|40|50|60|70|80|90)$/.test(value('decade'))?Number(value('decade')):0;
 const [{data:interests},{data:styleOptions},{data:myIdeal},{data:mySelf},interestMembers,styleMembers]=await Promise.all([
  supabase.from('interests').select('id,label').eq('is_active',true).order('sort_order'),
  supabase.from('ideal_type_options').select('id,label,category').eq('is_active',true).in('category',['성향','성격']).order('sort_order'),
  supabase.from('profile_ideal_types').select('option_id').eq('user_id',user.id),
  supabase.from('profile_self_types').select('option_id').eq('user_id',user.id),
  /^[0-9a-f-]{36}$/i.test(value('interest'))?supabase.from('profile_interests').select('user_id').eq('interest_id',value('interest')):Promise.resolve({data:null,error:null}),
  style?supabase.from('profile_self_types').select('user_id').eq('option_id',style):Promise.resolve({data:null,error:null})
 ]);
 let query=supabase.from('profiles').select('id,nickname,birth_year,region,gender,job,mbti,bio,avatar_path,joined_at').eq('membership_status','active').order('joined_at',{ascending:false}).limit(50);
 if(q)query=query.ilike('nickname',`%${q.replace(/[%_\\]/g,'\\$&')}%`);
 if(region)query=query.ilike('region',`%${region.replace(/[%_\\]/g,'\\$&')}%`);
 if(job)query=query.ilike('job',`%${job.replace(/[%_\\]/g,'\\$&')}%`);
 if(mbti)query=query.eq('mbti',mbti);
 if(gender)query=query.eq('gender',gender);
 if(decade){const year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Asia/Seoul'}).format(new Date()));query=query.gte('birth_year',year-(decade+9)+1).lte('birth_year',year-decade+1);}
 if(interestMembers.error||styleMembers.error)return <section className="placeholder"><h1>회원 찾기</h1><p role="alert">검색 조건을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p></section>;
 if(value('interest')&&interestMembers.data)query=query.in('id',interestMembers.data.map(row=>row.user_id).length?interestMembers.data.map(row=>row.user_id):['00000000-0000-0000-0000-000000000000']);
 if(style&&styleMembers.data)query=query.in('id',styleMembers.data.map(row=>row.user_id).length?styleMembers.data.map(row=>row.user_id):['00000000-0000-0000-0000-000000000000']);
 const wanted=new Set((myIdeal??[]).map(item=>item.option_id));
 const mine=new Set((mySelf??[]).map(item=>item.option_id));
 if(mutual){
  let eligible:string[]=[];
  if(wanted.size&&mine.size){
   const [{data:theyHave,error:forwardError},{data:theyWant,error:reverseError}]=await Promise.all([
    supabase.from('profile_self_types').select('user_id').in('option_id',[...wanted]),
    supabase.from('profile_ideal_types').select('user_id').in('option_id',[...mine])
   ]);
   if(forwardError||reverseError)return <section className="placeholder"><h1>회원 찾기</h1><p role="alert">서로의 취향을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p></section>;
   const reverse=new Set((theyWant??[]).map(row=>row.user_id));
   eligible=[...new Set((theyHave??[]).map(row=>row.user_id))].filter(id=>id!==user.id&&reverse.has(id));
  }
  query=query.in('id',eligible.length?eligible:['00000000-0000-0000-0000-000000000000']);
 }
 const {data,error}=await query;
 if(error)return <section className="placeholder"><h1>회원 찾기</h1><p role="alert">목록을 불러오지 못했습니다. 새 데이터베이스 설정을 확인해 주세요.</p></section>;
 const [{data:selfTypes},{data:theirIdeal}]=data?.length?await Promise.all([
  supabase.from('profile_self_types').select('user_id,option_id,ideal_type_options(label)').in('user_id',data.map(member=>member.id)),
  supabase.from('profile_ideal_types').select('user_id,option_id').in('user_id',data.map(member=>member.id))
 ]):[{data:[]},{data:[]}];
 const stylesByUser=new Map<string,{label:string;wanted:boolean}[]>();
 for(const row of selfTypes??[]){const option=Array.isArray(row.ideal_type_options)?row.ideal_type_options[0]:row.ideal_type_options;if(!option)continue;stylesByUser.set(row.user_id,[...(stylesByUser.get(row.user_id)??[]),{label:option.label,wanted:wanted.has(row.option_id)}]);}
 const reverseByUser=new Map<string,number>();
 for(const row of theirIdeal??[])if(mine.has(row.option_id))reverseByUser.set(row.user_id,(reverseByUser.get(row.user_id)??0)+1);
 const members=await Promise.all((data??[]).map(async member=>({member,styles:stylesByUser.get(member.id)??[],reverseCount:reverseByUser.get(member.id)??0,photo:member.avatar_path?(await supabase.storage.from('avatars').createSignedUrl(member.avatar_path,60)).data?.signedUrl:null})));
 return <section className="content-section"><span className="eyebrow dark">FEVER MEMBERS</span><h1>함께하는 사람들</h1><p>승인된 회원의 이야기를 찾아보세요.</p><p className="gender-color-guide">닉네임 테두리 <span className="gender-key male">파랑 · 남</span><span className="gender-key female">빨강 · 여</span><span className="gender-key neutral">회색 · 미공개</span></p>
  <form className="member-filters" action="/members"><input name="q" aria-label="닉네임 검색" placeholder="닉네임 검색" defaultValue={q}/><input name="region" aria-label="거주지역" placeholder="거주지역" defaultValue={region}/><input name="job" aria-label="직업" placeholder="직업" defaultValue={job}/><select name="decade" aria-label="나이대" defaultValue={value('decade')}><option value="">모든 나이대</option>{[10,20,30,40,50,60,70,80,90].map(value=><option key={value} value={value}>{value}대</option>)}</select><select name="gender" aria-label="성별" defaultValue={gender}><option value="">모든 성별</option><option value="male">남</option><option value="female">여</option></select><select name="mbti" aria-label="MBTI" defaultValue={mbti}><option value="">모든 MBTI</option>{['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'].map(value=><option key={value} value={value}>{value}</option>)}</select><select name="interest" aria-label="관심사" defaultValue={value('interest')}><option value="">모든 관심사</option>{interests?.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><select name="style" aria-label="내 스타일" defaultValue={style}><option value="">모든 스타일</option>{styleOptions?.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><label className="mutual-filter"><input type="checkbox" name="mutual" value="1" defaultChecked={mutual}/> 서로 취향이 통하는 회원</label><button className="button green">찾기</button><Link className="text-link" href="/members">초기화</Link></form>
  {mutual&&(!wanted.size||!mine.size)&&<div className="notice">서로의 취향을 찾으려면 <Link className="text-link" href="/profile/edit">내 스타일과 이상형 취향을 먼저 설정해 주세요 →</Link></div>}
  <div className="member-grid">{members.map(({member,photo,styles,reverseCount})=>{const forwardCount=styles.filter(item=>item.wanted).length;return <Link className={`member-card ${genderClass(member.gender)}`} href={`/members/${member.id}`} key={member.id}>{photo?<Image unoptimized src={photo} alt={`${member.nickname} 프로필 사진`} width={66} height={66}/>:<div className="avatar-fallback"/>}<div><strong>{member.nickname}</strong><span className="member-mbti-badge">{member.mbti?`MBTI ${member.mbti}`:'MBTI 미설정'}</span><p>{ageDecade(member.birth_year)} · {member.region}</p>{member.job&&<small>{member.job}</small>}{styles.length>0&&<span className="member-style-summary">{styles.slice(0,2).map(item=>item.label).join(' · ')}{styles.length>2?` 외 ${styles.length-2}개`:''}</span>}{member.id!==user.id&&forwardCount>0&&<span className="member-overlap">{reverseCount>0?'서로 취향이 통해요':`내 취향과 ${forwardCount}개 겹침`}</span>}</div></Link>})}</div>
  {!members.length&&wanted.size>0&&mine.size>0&&<div className="notice">조건에 맞는 회원이 없습니다. 다른 검색 조건도 살펴보세요.</div>}{!members.length&&!(wanted.size>0&&mine.size>0)&&!mutual&&<div className="notice">조건에 맞는 회원이 없습니다.</div>}{members.length===50&&<p className="list-hint">최근 가입한 회원 50명까지 표시합니다. 검색 조건을 좁혀 주세요.</p>}
 </section>;
}
