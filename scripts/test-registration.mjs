import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const id='00000000-0000-0000-0000-000000000021';
const user={id,aud:'authenticated',role:'authenticated',email:'registration@example.test',email_confirmed_at:new Date().toISOString(),app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:new Date().toISOString()};
const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const accessToken=`${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})}.test`;
let registered=false,submission=null,signupRequests=0,uploadRequests=0,legacyAccount=false,loginMode="invalid_credentials",recoveryRequests=0,newPassword=null,globalLogout=false;
const backend=createServer(async(req,res)=>{
 let body='';for await(const chunk of req)body+=chunk.toString();
 res.setHeader('content-type','application/json');
 if(req.url.startsWith('/auth/v1/signup')){signupRequests++;user.user_metadata=legacyAccount?{}:JSON.parse(body).data;res.end(JSON.stringify({access_token:accessToken,token_type:'bearer',expires_in:3600,refresh_token:'test-refresh-token',user}));}
 else if(req.url.startsWith('/auth/v1/recover')){
  recoveryRequests++;assert.equal(new URL(req.url,'http://fixture').searchParams.get('redirect_to'),'http://127.0.0.1:3102/auth/recovery');res.end('{}');
 }
 else if(req.url.startsWith('/auth/v1/logout')){globalLogout=new URL(req.url,'http://fixture').searchParams.get('scope')==='global';res.statusCode=204;res.end();}
 else if(req.url.startsWith('/auth/v1/token')&&new URL(req.url,'http://fixture').searchParams.get('grant_type')==='pkce'){
  const input=JSON.parse(body);
  if(input.auth_code==='fixture-recovery-code'&&input.code_verifier)res.end(JSON.stringify({access_token:accessToken,token_type:'bearer',expires_in:3600,refresh_token:'test-refresh-token',user}));
  else{res.statusCode=400;res.end(JSON.stringify({code:'bad_code_verifier',msg:'Expired fixture link'}));}
 }
 else if(req.url.startsWith('/auth/v1/token')){
  if(loginMode==='success')res.end(JSON.stringify({access_token:accessToken,token_type:'bearer',expires_in:3600,refresh_token:'test-refresh-token',user}));
  else{res.statusCode=400;res.end(JSON.stringify({code:loginMode,error_code:loginMode,msg:'Fixture login failure'}));}
 }
 else if(req.url.startsWith('/auth/v1/user')){
  if(req.method==='PUT'){const input=JSON.parse(body);assert.ok(Object.keys(input).every(key=>['password','code_challenge','code_challenge_method'].includes(key)));assert.equal(typeof input.password,'string');newPassword=input.password;}
  res.end(JSON.stringify(user));
 }
 else if(req.url.startsWith('/rest/v1/profiles'))res.end(JSON.stringify([{id,membership_status:registered?'pending_approval':'pending_email'}]));
 else if(req.url.startsWith('/rest/v1/user_roles'))res.end('[]');
 else if(req.url.startsWith('/storage/v1/object/avatars/')){uploadRequests++;res.end(JSON.stringify({Key:req.url.slice('/storage/v1/object/'.length)}));}
 else if(req.url==='/rest/v1/rpc/submit_membership'){
  submission=JSON.parse(body);assert.equal(submission.p_nickname,'피버테스트');assert.equal(submission.p_terms_version,'2026-10-12-v1');assert.equal(submission.p_privacy_version,'2026-10-12-v1');registered=true;res.end('null');
 }else{res.statusCode=404;res.end(JSON.stringify({error:'Unsupported fixture route'}));}
});
await new Promise(resolve=>backend.listen(0,'127.0.0.1',resolve));
const backendPort=backend.address().port;
const next=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3102'],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:`http://127.0.0.1:${backendPort}`,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture-publishable-key',FEVER_TERMS_URL:'',FEVER_PRIVACY_URL:'',FEVER_TERMS_VERSION:'',FEVER_PRIVACY_VERSION:'',NODE_USE_ENV_PROXY:'0'},stdio:['ignore','pipe','pipe']});
let log='';next.stdout.on('data',chunk=>log+=chunk);next.stderr.on('data',chunk=>log+=chunk);
let browser;
try{
 let ready=false;
 for(let n=0;n<120;n++){
  if(next.exitCode!==null)throw new Error('Next exited: '+log.slice(-2000));
  try{const response=await fetch('http://127.0.0.1:3102/signup');if(response.ok){ready=true;break;}}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 assert.equal(ready,true,'Next startup');
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
 for(const [width,legacy] of [[390,false],[1280,false],[390,true]]){
  legacyAccount=legacy;
  registered=false;submission=null;
  const context=await browser.newContext({viewport:{width,height:844}});const page=await context.newPage();
  await page.goto('http://127.0.0.1:3102/signup');
  await page.getByLabel('이메일',{exact:true}).fill(user.email);
  await page.getByLabel('비밀번호',{exact:true}).fill('Fever-test-password1');
  await page.getByLabel('비밀번호 확인').fill('Fever-test-password1');
  const createAccount=page.getByRole('button',{name:'가입정보 입력하기'});
  assert.equal(await createAccount.isDisabled(),true);
  await page.locator('input[name=terms]').check();
  assert.equal(await createAccount.isDisabled(),true);
  await page.locator('input[name=privacy]').check();
  assert.equal(await createAccount.isEnabled(),true);
  await createAccount.click();
  await page.waitForURL('**/pending');
  await page.getByRole('heading',{name:'나를 소개해 주세요'}).waitFor();
  await page.getByLabel('닉네임',{exact:true}).fill('피버테스트');
  await page.getByLabel('출생연도').fill('1995');
  await page.getByLabel('거주지역').fill('서울');
  await page.getByLabel('프로필 사진',{exact:true}).setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=','base64')});
  const submit=page.getByRole('button',{name:'가입 승인 신청하기'});
  if(legacy){
   assert.equal(await submit.isDisabled(),true);
   await page.locator('input[name=terms]').check();assert.equal(await submit.isDisabled(),true);
   await page.locator('input[name=privacy]').check();assert.equal(await submit.isEnabled(),true);
  }else{
   assert.equal(await page.locator('input[type=checkbox]').count(),0);
   assert.equal(await submit.isEnabled(),true);
   await page.getByText('가입 단계에서 이용약관과 개인정보 수집·이용에 동의했습니다.',{exact:false}).waitFor();
  }
  await submit.click();await page.getByRole('heading',{name:'가입 승인 대기'}).waitFor();
  assert.ok(submission);await context.close();
 }
 const loginContext=await browser.newContext();const loginPage=await loginContext.newPage();
 await loginPage.goto('http://127.0.0.1:3102/login');
 await loginPage.getByLabel('이메일',{exact:true}).fill(user.email);
 await loginPage.getByLabel('비밀번호',{exact:true}).fill('Fever-test-password1');
 await loginPage.getByRole('button',{name:'로그인',exact:true}).click();
 await loginPage.getByRole('alert').filter({hasText:'invalid_credentials'}).waitFor();
 assert.equal(await loginPage.getByLabel('이메일',{exact:true}).inputValue(),user.email);
 assert.equal(await loginPage.getByLabel('비밀번호',{exact:true}).inputValue(),'Fever-test-password1');
 loginMode='email_not_confirmed';await loginPage.getByRole('button',{name:'로그인',exact:true}).click();
 await loginPage.getByRole('alert').filter({hasText:'email_not_confirmed'}).waitFor();
 loginMode='success';await loginPage.getByRole('button',{name:'로그인',exact:true}).click();
 await loginPage.waitForURL('**/pending');await loginPage.getByRole('heading',{name:'가입 승인 대기'}).waitFor();
 await loginPage.goto('http://127.0.0.1:3102/account/status');
 await loginPage.getByRole('heading',{name:'현재 로그인 계정'}).waitFor();
 assert.ok(await loginPage.getByText(id,{exact:true}).isVisible());
 assert.ok(await loginPage.getByText(user.email,{exact:true}).isVisible());
 assert.ok(await loginPage.getByText('등록된 권한 없음',{exact:true}).isVisible());
 await loginContext.close();
 const recoveryContext=await browser.newContext();const recoveryPage=await recoveryContext.newPage();
 await recoveryPage.goto('http://127.0.0.1:3102/account/status');assert.match(recoveryPage.url(),/\/login/);
 await recoveryPage.goto('http://127.0.0.1:3102/account/reset-password');assert.match(recoveryPage.url(),/\/login/);
 await recoveryPage.goto('http://127.0.0.1:3102/forgot-password');
 await recoveryPage.getByLabel('가입한 이메일').fill(user.email);
 await recoveryPage.getByRole('button',{name:'비밀번호 재설정 메일 받기'}).click();
 await recoveryPage.getByRole('status').filter({hasText:'가입된 주소인 경우'}).waitFor();
 assert.equal(recoveryRequests,1);
 const expired=await recoveryContext.request.get('http://127.0.0.1:3102/auth/recovery?code=expired&next=https://evil.example',{maxRedirects:0});
 assert.equal(expired.status(),303);assert.equal(expired.headers().location,'/auth/error?reason=recovery');
 assert.equal(expired.headers()['referrer-policy'],'no-referrer');
 // Request a new verifier after the expired exchange; a consumed link cannot be reused.
 await recoveryPage.getByRole('button',{name:'비밀번호 재설정 메일 받기'}).click();
 await recoveryPage.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(button=>button.textContent.includes('비밀번호 재설정 메일 받기')&&!button.disabled));
 for(let i=0;i<50&&recoveryRequests<2;i++)await new Promise(resolve=>setTimeout(resolve,100));
 await recoveryPage.goto('http://127.0.0.1:3102/auth/recovery?code=fixture-recovery-code&next=https://evil.example');
 await recoveryPage.waitForURL('**/account/reset-password');
 await recoveryPage.getByLabel('새 비밀번호',{exact:true}).fill('Recovered-password2');
 await recoveryPage.getByLabel('새 비밀번호 확인').fill('Mismatched-password3');
 await recoveryPage.getByRole('button',{name:'새 비밀번호 저장'}).click();
 await recoveryPage.getByRole('alert').filter({hasText:'확인 값이 같아야'}).waitFor();assert.equal(newPassword,null);
 await recoveryPage.getByLabel('새 비밀번호 확인').fill('Recovered-password2');
 await recoveryPage.getByRole('button',{name:'새 비밀번호 저장'}).click();
 await recoveryPage.waitForURL('**/login?reset=success');
 await recoveryPage.getByRole('status').filter({hasText:'비밀번호가 변경되었습니다'}).waitFor();
 assert.equal(newPassword,'Recovered-password2');assert.equal(globalLogout,true);
 await recoveryContext.close();
 assert.equal(signupRequests,3);assert.equal(uploadRequests,3);
 for(const path of ['/terms','/privacy']){const response=await fetch('http://127.0.0.1:3102'+path);assert.equal(response.status,200);assert.match(await response.text(),/FEVER 운영팀/);}
 console.log('Registration integration passed (mobile + desktop): direct signup session -> profile form without duplicate consents (legacy users give consent once) -> photo upload -> versioned RPC -> pending approval; login errors are distinguished, inputs survive errors, successful login routes correctly; recovery verifies links, rejects mismatched passwords, changes only password and logs out; public legal pages work. Auth/Storage responses are fixtures, not real account creation.');
}catch(error){console.error(log.slice(-1500));throw error;}
finally{await browser?.close();next.kill('SIGTERM');await new Promise(resolve=>backend.close(resolve));}
