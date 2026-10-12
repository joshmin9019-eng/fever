import {test,expect} from '@playwright/test';
import {accessDestination} from '../src/lib/auth/access';
import {validNickname,validAvatar} from '../src/lib/auth/registration';
test('membership and role matrix fails closed',()=>{
 for(const status of ['pending_email','pending_approval','withdrawal_requested',null,'unknown'])expect(accessDestination(status,['super_admin'],'member')).toBe('/pending');
 expect(accessDestination('rejected',[],'member')).toBe('/account/rejected');
 for(const status of ['suspended','deleted'])expect(accessDestination(status,['super_admin'],'admin')).toBe('/account/suspended');
 expect(accessDestination('active',['member'],'admin')).toBe('/forbidden');
 expect(accessDestination('active',['admin'],'super_admin')).toBe('/forbidden');
 expect(accessDestination('active',['super_admin'],'admin')).toBeNull();
 expect(accessDestination('active',['super_admin'],'super_admin')).toBeNull();
 expect(accessDestination('active',[],'member')).toBeNull();
});
test('nickname and upload validation enforce confirmed policy',()=>{
 for(const value of ['피버','Fever_01'])expect(validNickname(value)).toBe(true);
 for(const value of ['가',' 닉네임','a b','닉네임!','a'.repeat(21)])expect(validNickname(value)).toBe(false);
 expect(validAvatar(new Uint8Array([137,80,78,71,13,10,26,10]),'image/png')).toBe(true);
 expect(validAvatar(new Uint8Array([255,216,255]),'image/jpeg')).toBe(true);
 expect(validAvatar(new TextEncoder().encode('RIFF0000WEBP'),'image/webp')).toBe(true);
 expect(validAvatar(new TextEncoder().encode('<svg/>'),'image/png')).toBe(false);
 expect(validAvatar(new Uint8Array(5*1024*1024+1),'image/jpeg')).toBe(false);
});

import {hasCurrentConsent} from '../src/lib/auth/consent';
test('only recorded consent for both current documents skips the profile checks',()=>{
 const versions={termsVersion:'v1',privacyVersion:'v1'};
 const signup_consent={terms_accepted:true,privacy_accepted:true,terms_version:'v1',privacy_version:'v1',accepted_at:'2026-10-12T00:00:00Z'};
 expect(hasCurrentConsent({signup_consent},versions)).toBe(true);
 for(const changed of [{terms_accepted:false},{privacy_version:'old'},{terms_version:'old'},{accepted_at:'invalid'}])expect(hasCurrentConsent({signup_consent:{...signup_consent,...changed}},versions)).toBe(false);
 expect(hasCurrentConsent(undefined,versions)).toBe(false);
 expect(hasCurrentConsent({signup_consent:'invalid'},versions)).toBe(false);
});
