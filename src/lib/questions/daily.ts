export function koreaToday(now=new Date()) {
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=(type:string)=>parts.find(item=>item.type===type)?.value??'';
 return `${part('year')}-${part('month')}-${part('day')}`;
}

export function dailyQuestionIndex(day:string,count:number) {
 if(count<1)return -1;
 const elapsed=Math.round((Date.parse(`${day}T00:00:00Z`)-Date.parse('2020-01-01T00:00:00Z'))/86400000);
 return ((elapsed%count)+count)%count;
}
