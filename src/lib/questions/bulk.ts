export type BulkQuestion={line:number;title:string;type:'text'|'single_choice'|'balance_game';options:string[]};
export type BulkParse={questions:BulkQuestion[];errors:string[]};

export function parseBulkQuestions(source:string):BulkParse{
 const questions:BulkQuestion[]=[];
 const errors:string[]=[];
 const seen=new Set<string>();
 const lines=source.replaceAll('\r','').split('\n');
 if(source.length>30000)errors.push('입력 내용은 30,000자 이내로 넣어 주세요.');
 for(let index=0;index<lines.length;index++){
  const raw=lines[index].trim();
  if(!raw)continue;
  const [kind,title,...choices]=raw.split('|').map(part=>part.trim());
  const line=index+1;
  const type=kind==='주관식'?'text':kind==='객관식'?'single_choice':kind==='밸런스'?'balance_game':null;
  if(!type){errors.push(`${line}행: 형식은 주관식·객관식·밸런스 중 하나여야 합니다.`);continue;}
  if(!title||title.length>300){errors.push(`${line}행: 질문 문구는 1~300자여야 합니다.`);continue;}
  if(choices.some(choice=>!choice||choice.length>200)){errors.push(`${line}행: 선택지마다 1~200자를 입력해 주세요.`);continue;}
  if(type==='text'&&choices.length||type==='single_choice'&&choices.length<2||type==='balance_game'&&choices.length!==2){errors.push(`${line}행: ${type==='text'?'주관식에는 선택지를 넣지 마세요.':type==='balance_game'?'밸런스는 선택지가 정확히 2개여야 합니다.':'객관식은 선택지가 2개 이상이어야 합니다.'}`);continue;}
  if(new Set(choices.map(choice=>choice.toLocaleLowerCase('ko-KR'))).size!==choices.length){errors.push(`${line}행: 같은 선택지를 중복 입력하지 마세요.`);continue;}
  const key=title.replace(/\s+/g,' ').toLocaleLowerCase('ko-KR');
  if(seen.has(key)){errors.push(`${line}행: 같은 묶음에 질문 문구가 중복됐습니다.`);continue;}
  seen.add(key);
  questions.push({line,title,type,options:choices});
 }
 if(questions.length>50)errors.push('한 번에 질문은 최대 50개까지 등록할 수 있습니다.');
 return {questions,errors};
}
