import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const id='00000000-0000-0000-0000-000000000031';
const questionId='00000000-0000-0000-0000-000000000032';
const categoryId='00000000-0000-0000-0000-000000000033';
const user={id,aud:'authenticated',role:'authenticated',email:'member@example.test',email_confirmed_at:new Date().toISOString(),app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:new Date().toISOString()};
const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const accessToken=`${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})}.fixture`;
let profileSave=null,answerSave=null;
const profile={id,nickname:'민지',membership_status:'active',birth_year:1997,region:'서울',gender:'female',job:'디자이너',mbti:'INFP',bio:'책과 여행을 좋아해요.',avatar_path:null,joined_at:new Date().toISOString()};
const question={id:questionId,title:'나를 한 문장으로 소개한다면?',type:'text',is_active:true,sort_order:0,question_categories:{name:'우리 이야기',sort_order:0},question_options:[]};
const backend=createServer(async(req,res)=>{
 let body='';for await(const chunk of req)body+=chunk.toString();
 const url=new URL(req.url,'http://fixture');const path=url.pathname;
 res.setHeader('content-type','application/json');
 const output=(rows)=>{
  const singular=String(req.headers.accept??'').includes('application/vnd.pgrst.object+json');
  res.end(JSON.stringify(singular?(rows[0]??null):rows));
 };
 if(path==='/auth/v1/token'){res.end(JSON.stringify({access_token:accessToken,token_type:'bearer',expires_in:3600,refresh_token:'test-refresh-token',user}));}
 else if(path==='/auth/v1/user')res.end(JSON.stringify(user));
 else if(path==='/rest/v1/profiles')output([profile]);
 else if(path==='/rest/v1/user_roles')output([{role:'member'}]);
 else if(path==='/rest/v1/interests')output([{id:categoryId,label:'여행',is_active:true,sort_order:1}]);
 else if(path==='/rest/v1/profile_interests')output([]);
 else if(path==='/rest/v1/nickname_change_requests')output([]);
 else if(path==='/rest/v1/questions'){
  if(req.method==='HEAD'){res.setHeader('content-range','0-0/1');res.end();}
  else output([question]);
 }
 else if(path==='/rest/v1/answers'){
  if(req.method==='HEAD'){res.setHeader('content-range',answerSave?'0-0/1':'*/0');res.end();}
  else if(!answerSave)output([]);
  else if(url.searchParams.get('select')==='question_id')output([{question_id:questionId}]);
  else if(url.searchParams.get('select')==='text_value,option_id')output([{text_value:answerSave.p_text_value,option_id:null}]);
  else output([{id:'00000000-0000-0000-0000-000000000034',text_value:answerSave.p_text_value,questions:{id:questionId,title:question.title,type:'text',question_categories:{name:'우리 이야기'}},question_options:null}]);
 }
 else if(path==='/rest/v1/rpc/update_my_profile'){profileSave=JSON.parse(body);res.end('null');}
 else if(path==='/rest/v1/rpc/save_answer'){answerSave=JSON.parse(body);res.end('null');}
 else{res.statusCode=404;res.end(JSON.stringify({error:'Unsupported fixture route: '+path}));}
});
await new Promise(resolve=>backend.listen(0,'127.0.0.1',resolve));
const backendPort=backend.address().port;
const next=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3106'],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:`http://127.0.0.1:${backendPort}`,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture-publishable-key',NODE_USE_ENV_PROXY:'0'},stdio:['ignore','pipe','pipe']});
let log='';next.stdout.on('data',chunk=>log+=chunk);next.stderr.on('data',chunk=>log+=chunk);
let browser;
try{
 let ready=false;
 for(let n=0;n<120;n++){if(next.exitCode!==null)throw new Error('Next exited: '+log.slice(-2000));try{const response=await fetch('http://127.0.0.1:3106/login');if(response.ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,250));}
 assert.equal(ready,true,'Next startup');
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:3106/login');
 await page.getByLabel('이메일',{exact:true}).fill(user.email);
 await page.getByLabel('비밀번호',{exact:true}).fill('test-password');
 await page.getByRole('button',{name:'로그인',exact:true}).click();
 await page.waitForURL('**/profile');
 await page.getByRole('heading',{name:'나의 프로필'}).waitFor();
 assert.equal(await page.locator('.gender-badge.gender-female').count(),1);
 await page.getByRole('link',{name:'프로필 수정'}).click();
 await page.getByLabel('거주지역').fill('부산');
 await page.getByLabel('여행').check();
 await page.getByRole('button',{name:'프로필 저장'}).click();
 await page.getByText('프로필을 저장했습니다.').waitFor();
 assert.equal(profileSave.p_region,'부산');
 assert.deepEqual(profileSave.p_interest_ids,[categoryId]);
 await page.goto('http://127.0.0.1:3106/questions');
 await page.getByRole('link',{name:/나를 한 문장으로 소개한다면/}).click();
 await page.getByLabel('내 답변').fill('저는 책을 좋아하는 사람입니다.');
 await page.getByRole('button',{name:'답변 저장'}).click();
 await page.getByText('답변을 저장했습니다.').waitFor();
 assert.equal(answerSave.p_question_id,questionId);
 assert.equal(answerSave.p_text_value,'저는 책을 좋아하는 사람입니다.');
 await page.goto('http://127.0.0.1:3106/members');
 await page.getByText('민지').waitFor();
 assert.equal(await page.locator('.member-card.gender-female').count(),1);
 await page.goto(`http://127.0.0.1:3106/members/${id}/answers`);
 await page.getByText('저는 책을 좋아하는 사람입니다.').waitFor();
 console.log('Member features passed (mobile): login, profile/gender display, profile save, question answer, member search and public answer page. Backend responses are fixtures.');
}finally{
 if(browser)await browser.close();
 next.kill('SIGTERM');
 backend.close();
 await new Promise(resolve=>{if(next.exitCode!==null)resolve();else next.once('exit',resolve);});
}
