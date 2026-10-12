import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const id='00000000-0000-0000-0000-000000000031';
const questionId='00000000-0000-0000-0000-000000000032';
const categoryId='00000000-0000-0000-0000-000000000033';
const otherId='00000000-0000-0000-0000-000000000035';
const thirdId='00000000-0000-0000-0000-000000000038';
const idealId='00000000-0000-0000-0000-000000000037';
const user={id,aud:'authenticated',role:'authenticated',email:'member@example.test',email_confirmed_at:new Date().toISOString(),app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:new Date().toISOString()};
const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const accessToken=`${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})}.fixture`;
let profileSave=null,answerSave=null,questionCreated=null,idealSave=null,selfSave=null,birthSave=null,isAdmin=false;
const bulkCreated=[];
const profile={id,nickname:'민지',membership_status:'active',birth_year:1997,region:'서울',gender:'female',job:'디자이너',mbti:'INFP',bio:'책과 여행을 좋아해요.',avatar_path:null,joined_at:new Date().toISOString()};
const otherProfile={...profile,id:otherId,nickname:'준호',gender:'male',mbti:'ENFP',job:'개발자'};
const thirdProfile={...profile,id:thirdId,nickname:'지수',gender:'female',mbti:'ISTJ',job:'기획자'};
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
 else if(path==='/rest/v1/profiles')output(url.searchParams.get('mbti')==='eq.INTJ'?[]:url.searchParams.get('id')?.includes(otherId)?[otherProfile]:url.searchParams.get('select')?.includes('joined_at')?[profile,otherProfile,thirdProfile]:[profile]);
 else if(path==='/rest/v1/user_roles')output([{role:isAdmin?'admin':'member'}]);
 else if(path==='/rest/v1/interests')output([{id:categoryId,label:'여행',is_active:true,sort_order:1}]);
 else if(path==='/rest/v1/profile_interests')output((url.searchParams.get('select')??'').includes('interests(label)')?[{interests:{label:'여행'}}]:[]);
 else if(path==='/rest/v1/nickname_change_requests')output([]);
 else if(path==='/rest/v1/ideal_type_options')output([{id:idealId,category:'분위기',label:'고양이상',sort_order:1,is_active:true}]);
 else if(path==='/rest/v1/profile_ideal_types'){
  const item=user_id=>({user_id,option_id:idealId,ideal_type_options:{category:'분위기',label:'고양이상',sort_order:1}});
  output(idealSave?(url.searchParams.get('user_id')?.startsWith('in.')||url.searchParams.get('option_id')?.startsWith('in.')?[item(id),item(otherId)]:[item(url.searchParams.get('user_id')?.includes(otherId)?otherId:id)]):[]);
 }
 else if(path==='/rest/v1/profile_self_types'){
  const selection=url.searchParams.get('select')??'';
  const item=user_id=>({user_id,option_id:idealId,ideal_type_options:selection.includes('category')?{category:'분위기',label:'고양이상',sort_order:1}:{label:'고양이상'}});
  output(selfSave?(url.searchParams.get('user_id')?.startsWith('in.')||url.searchParams.get('option_id')?.startsWith('in.')?[item(id),item(otherId),item(thirdId)]:[item(url.searchParams.get('user_id')?.includes(otherId)?otherId:id)]):[]);
 }
 else if(path==='/rest/v1/profile_birthdates')output(birthSave?[{birth_month:birthSave.p_month,birth_day:birthSave.p_day}]:[]);
 else if(path==='/rest/v1/question_categories')output([{id:categoryId,name:'우리 이야기',is_active:true,sort_order:0}]);
 else if(path==='/rest/v1/daily_attendance')output(answerSave?[{question_id:questionId}]:[]);
 else if(path==='/rest/v1/questions'){
  if(req.method==='HEAD'){res.setHeader('content-range','0-0/1');res.end();}
  else output([question]);
 }
 else if(path==='/rest/v1/answers'){
  const selection=url.searchParams.get('select')??'';
  if(req.method==='HEAD'){res.setHeader('content-range',answerSave?'0-0/1':'*/0');res.end();}
  else if(selection.includes('profiles!inner')&&selection.includes('questions!inner'))output([{id:'00000000-0000-0000-0000-000000000036',user_id:otherId,question_id:questionId,text_value:'저는 산책하며 새로운 곳을 찾는 걸 좋아해요.',questions:{id:questionId,title:question.title,is_active:true,question_categories:{name:'우리 이야기'}},profiles:{id:otherId,nickname:'준호',gender:'male',membership_status:'active'},question_options:null}]);
  else if(selection.includes('profiles!inner'))output([{id:'00000000-0000-0000-0000-000000000036',user_id:otherId,text_value:'저는 산책하며 새로운 곳을 찾는 걸 좋아해요.',profiles:{nickname:'준호',gender:'male',membership_status:'active'},question_options:null}]);
  else if(selection.includes('profiles(nickname)'))output([]);
  else if(url.searchParams.get('user_id')?.includes(otherId)&&selection.includes('question_id'))output([{id:'00000000-0000-0000-0000-000000000036',question_id:questionId,text_value:'저는 산책을 좋아해요.',questions:{title:question.title},question_options:null}]);
  else if(!answerSave)output([]);
  else if(url.searchParams.get('select')==='question_id')output([{question_id:questionId}]);
  else if(url.searchParams.get('select')==='text_value,option_id')output([{text_value:answerSave.p_text_value,option_id:null}]);
  else output([{id:'00000000-0000-0000-0000-000000000034',text_value:answerSave.p_text_value,questions:{id:questionId,title:question.title,type:'text',question_categories:{name:'우리 이야기'}},question_options:null}]);
 }
 else if(path==='/rest/v1/rpc/update_my_profile'){profileSave=JSON.parse(body);res.end('null');}
 else if(path==='/rest/v1/rpc/save_answer'){answerSave=JSON.parse(body);res.end('null');}
 else if(path==='/rest/v1/rpc/save_my_ideal_types'){idealSave=JSON.parse(body);res.end('null');}
 else if(path==='/rest/v1/rpc/save_my_self_types'){selfSave=JSON.parse(body);res.end('null');}
 else if(path==='/rest/v1/rpc/save_my_birthdate'){birthSave=JSON.parse(body);res.end('null');}
 else if(path==='/rest/v1/rpc/delete_my_birthdate'){birthSave=null;res.end('null');}
 else if(path==='/rest/v1/rpc/create_question'){questionCreated=JSON.parse(body);bulkCreated.push(questionCreated);res.end(JSON.stringify(questionId));}
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
 assert.equal(await page.locator('.member-detail .member-name-ring.gender-female').count(),1);
 await page.locator('.member-detail').getByText('MBTI INFP').waitFor();
 await page.goto('http://127.0.0.1:3106/');
 await page.getByRole('heading',{name:'오늘의 질문'}).waitFor();
 assert.deepEqual(await page.locator('.home-page > section').evaluateAll(nodes=>nodes.slice(0,4).map(node=>node.classList[0])),['home-identity','daily-home','home-menu','today-answer']);
 await page.getByText('오늘 출석 전').waitFor();
 assert.equal(await page.getByRole('link',{name:/답하고 출석하기/}).count(),1);
 assert.equal(await page.locator('.home-menu-card').count(),4);
 assert.equal(await page.getByRole('link',{name:/내 답변 채우기/}).count(),1);
 await page.getByText('답변 0 / 전체 1개').waitFor();
 assert.equal(await page.getByRole('link',{name:/오늘의 운세/}).count(),1);
 const cardBoxes=await page.locator('.home-menu-card').evaluateAll(nodes=>nodes.map(node=>{const rect=node.getBoundingClientRect();return {x:rect.x,y:rect.y,width:rect.width,height:rect.height};}));
 assert.ok(Math.abs(cardBoxes[0].width-cardBoxes[3].width)<2,'fortune card matches other card width');
 assert.ok(Math.abs(cardBoxes[0].height-cardBoxes[3].height)<2,'fortune card matches other card height');
 assert.ok(Math.abs(cardBoxes[1].x-cardBoxes[3].x)<2&&Math.abs(cardBoxes[2].y-cardBoxes[3].y)<2,'fortune card fills lower-right grid slot');
 const profileGap=await page.locator('.home-identity').evaluate(node=>{const next=node.nextElementSibling;return next?next.getBoundingClientRect().top-node.getBoundingClientRect().bottom:0;});
 assert.ok(profileGap>=20,'profile and daily question have visible spacing');
 const fortuneLink=page.getByRole('link',{name:/오늘의 운세/});
 await fortuneLink.scrollIntoViewIfNeeded();
 const fortuneBox=await fortuneLink.boundingBox();
 await page.mouse.move(fortuneBox.x+fortuneBox.width/2,fortuneBox.y+fortuneBox.height/2);
 await page.mouse.down();
 await page.waitForTimeout(220);
 assert.notEqual(await fortuneLink.evaluate(node=>getComputedStyle(node).transform),'none','card gives pressed feedback');
 await page.mouse.up();
 await page.waitForURL('**/fortune');
 await page.getByRole('heading',{name:'오늘의 별자리 운세'}).waitFor();
 await page.getByLabel('태어난 월').selectOption('7');
 await page.getByLabel('태어난 일').selectOption('14');
 await page.getByRole('checkbox',{name:/선택 입력한 월·일/}).check();
 await page.getByRole('button',{name:'생일 저장하고 운세 보기'}).click();
 await page.getByRole('heading',{name:/게자리/}).waitFor();
 assert.equal(birthSave.p_month,7);
 assert.equal(birthSave.p_day,14);
 await page.getByRole('button',{name:'저장한 생일 월·일 삭제'}).click();
 await page.getByText('저장한 월·일을 삭제했습니다.').waitFor();
 assert.equal(birthSave,null);
 await page.goto('http://127.0.0.1:3106/');
 assert.equal(await page.locator('.bottom-nav').getByRole('link',{name:'회원'}).count(),1);
 assert.deepEqual(await page.locator('.home-menu-card').evaluateAll(nodes=>nodes.map(node=>new URL(node.href).pathname)),['/questions','/discover','/members','/fortune']);
 const memberNav=page.locator('.bottom-nav').getByRole('link',{name:'회원'});
 const navBox=await memberNav.boundingBox();
 await page.mouse.move(navBox.x+navBox.width/2,navBox.y+navBox.height/2);
 await page.mouse.down();
 await page.waitForTimeout(220);
 assert.notEqual(await memberNav.evaluate(node=>getComputedStyle(node).transform),'none','bottom menu gives pressed feedback');
 await page.mouse.up();
 await page.waitForURL('**/members');
 await page.goto('http://127.0.0.1:3106/discover');
 await page.getByText('저는 산책하며 새로운 곳을 찾는 걸 좋아해요.').waitFor();
 await page.getByRole('link',{name:/이 질문의 답변 더 보기/}).click();
 await page.getByRole('heading',{name:'다른 회원은 이렇게 답했어요'}).waitFor();
 await page.goto('http://127.0.0.1:3106/profile');
 await page.getByRole('link',{name:'프로필 수정'}).click();
 await page.getByLabel('거주지역').fill('부산');
 await page.getByLabel('여행').check();
 await page.getByRole('button',{name:'프로필 저장'}).click();
 await page.getByText('프로필을 저장했습니다.').waitFor();
 assert.equal(profileSave.p_region,'부산');
 assert.deepEqual(profileSave.p_interest_ids,[categoryId]);
 await page.locator('input[name="idealTypeId"]').check();
 await page.getByRole('button',{name:'이상형 취향 저장'}).click();
 await page.getByText('이상형 취향을 저장했습니다.').waitFor();
 assert.deepEqual(idealSave.p_option_ids,[idealId]);
 await page.getByRole('heading',{name:'나를 나타내는 스타일'}).waitFor();
 await page.locator('input[name="selfTypeId"]').check();
 await page.getByRole('button',{name:'내 스타일 저장'}).click();
 await page.getByText('내 스타일을 저장했습니다.').waitFor();
 assert.deepEqual(selfSave.p_option_ids,[idealId]);
 await page.goto('http://127.0.0.1:3106/profile');
 await page.getByRole('heading',{name:'마음이 가는 스타일'}).waitFor();
 await page.getByText('고양이상').first().waitFor();
 await page.getByRole('heading',{name:'나를 나타내는 스타일'}).waitFor();
 await page.goto('http://127.0.0.1:3106/questions');
 await page.getByRole('link',{name:/나를 한 문장으로 소개한다면/}).click();
 await page.getByLabel('내 답변').fill('저는 책을 좋아하는 사람입니다.');
 await page.getByRole('button',{name:'답변 저장'}).click();
 await page.getByText('답변을 저장했습니다.').waitFor();
 assert.equal(answerSave.p_question_id,questionId);
 assert.equal(answerSave.p_text_value,'저는 책을 좋아하는 사람입니다.');
 await page.goto('http://127.0.0.1:3106/');
 await page.getByText('오늘 출석 완료').waitFor();
 await page.getByText('답변 1 / 전체 1개').waitFor();
 await page.goto('http://127.0.0.1:3106/members');
 await page.getByText('민지').waitFor();
 assert.equal(await page.locator('.member-card.gender-female').count(),2);
 await page.locator('.member-card').getByText('MBTI INFP').waitFor();
 await page.locator('.member-card.gender-male').getByText('서로 취향이 통해요').waitFor();
 assert.equal(await page.locator('.member-card.gender-female').getByText('서로 취향이 통해요').count(),0);
 await page.locator('.member-card').filter({hasText:'지수'}).getByText('내 취향과 1개 겹침').waitFor();
 await page.getByLabel('서로 취향이 통하는 회원').check();
 await page.getByRole('button',{name:'찾기'}).click();
 await page.locator('.member-card.gender-male').getByText('서로 취향이 통해요').waitFor();
 assert.equal(await page.locator('.member-card.gender-female').count(),0);
 await page.locator('.member-card.gender-male').click();
 await page.getByRole('heading',{name:'함께 이야기할 거리'}).waitFor();
 await page.getByText('함께 고른 관심사: 여행').waitFor();
 await page.getByRole('link',{name:/둘 다 답한 질문/}).waitFor();
 await page.goto('http://127.0.0.1:3106/members');
 await page.getByRole('combobox',{name:'MBTI'}).selectOption('INTJ');
 await page.getByRole('button',{name:'찾기'}).click();
 await page.getByText('조건에 맞는 회원이 없습니다.').waitFor();
 await page.goto(`http://127.0.0.1:3106/members/${id}/answers`);
 await page.getByText('저는 책을 좋아하는 사람입니다.').waitFor();
 isAdmin=true;
 await page.goto('http://127.0.0.1:3106/admin/questions');
 await page.getByRole('heading',{name:'질문 등록 방법'}).waitFor();
 await page.locator('#questionCategory').selectOption(categoryId);
 await page.getByLabel('질문 문구').fill('둘 중 더 좋은 하루는?');
 await page.getByLabel('답변 형식').selectOption('balance_game');
 await page.getByLabel('선택지').fill('아침형\n저녁형');
 await page.getByRole('button',{name:'질문 등록',exact:true}).click();
 await page.getByText('질문을 등록했습니다.').waitFor();
 assert.deepEqual(questionCreated.p_option_labels,['아침형','저녁형']);
 await page.locator('#bulkCategory').selectOption(categoryId);
 await page.locator('#bulkQuestions').fill('주관식 | 요즘 가장 즐거운 순간은?\n객관식 | 쉬는 날 가고 싶은 곳은? | 바다 | 산');
 await page.getByText('등록 미리보기 · 2개 질문').waitFor();
 await page.getByRole('button',{name:'미리보기대로 질문 등록'}).click();
 await page.getByText('2개 질문을 등록했습니다.').waitFor();
 assert.equal(bulkCreated.length,3);
 assert.deepEqual(bulkCreated.slice(1).map(item=>item.p_type).sort(),['single_choice','text']);
 console.log('Member features passed (mobile): daily check-in, private horoscope birthday save/delete, profile styles, MBTI name display, MBTI search, mutual style filtering, conversation starters, answers, and admin bulk questions. Backend responses are fixtures.');
}finally{
 if(browser)await browser.close();
 next.kill('SIGTERM');
 backend.close();
 await new Promise(resolve=>{if(next.exitCode!==null)resolve();else next.once('exit',resolve);});
}
