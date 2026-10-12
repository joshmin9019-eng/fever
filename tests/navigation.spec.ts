import {test,expect} from '@playwright/test';
test('mobile home and disabled authentication are honest without configuration',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:/내 이야기가/})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('link',{name:'FEVER 함께하기'}).click();await expect(page.getByRole('heading',{name:'FEVER 함께하기'})).toBeVisible();
 await expect(page.getByRole('button',{name:'가입정보 입력하기'})).toBeDisabled();
 await page.getByRole('navigation').getByRole('link',{name:'대화',exact:true}).click();await expect(page).toHaveURL(/\/login/);
 await expect(page.getByRole('button',{name:'로그인',exact:true})).toBeDisabled();
 expect(errors).toEqual([]);
});
test('protected URLs redirect and invalid confirmation cannot redirect externally',async({request})=>{
 for(const route of ['/pending','/account/rejected','/account/suspended','/profile','/profile/edit','/profile/history','/members','/members/example','/questions','/questions/example','/discover','/events','/events/new','/events/example','/admin','/admin/members','/admin/requests','/admin/questions','/admin/events','/admin/roles','/admin/audit','/admin/settings']){
 const response=await request.get(route,{maxRedirects:0});expect(response.status(),route).toBe(307);expect(response.headers().location).toMatch(/^\/login/);
 }
 for(const route of ['/auth/callback?next=https://evil.example','/auth/confirm?type=recovery&token_hash=fake&next=https://evil.example']){
 const response=await request.get(route,{maxRedirects:0});expect(response.status()).toBe(303);expect(response.headers().location).toBe('/auth/error');
 }
 expect((await request.get('/missing-page')).status()).toBe(404);
});
