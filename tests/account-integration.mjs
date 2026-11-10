import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
function tokenFrom(mail){return new URL(mail.text.match(/http[^\s]+/)[0]).searchParams.get('token');}
export async function verifyAccounts({request,db,mail,seller,other,admin}){
 const details={name:'Security Test',email:'security@example.test',password:'initial-password-123',phone:'0771234567',location:'Kampala'};
 const first=(await request('/api/auth/register',{method:'POST',body:details,status:201})).cookie;
 const second=(await request('/api/auth/login',{method:'POST',body:{email:details.email,password:details.password}})).cookie;
 await request('/api/account/password',{method:'POST',cookie:first,body:{currentPassword:'wrong-password',newPassword:'changed-password-123'},status:400});
 await request('/api/account/password',{method:'POST',cookie:first,body:{currentPassword:details.password,newPassword:'changed-password-123'}});
 for(const cookie of [first,second])assert.equal((await request('/api/me',{cookie})).data.user,null);
 await request('/api/auth/login',{method:'POST',body:{email:details.email,password:details.password},status:401});
 const changed=(await request('/api/auth/login',{method:'POST',body:{email:details.email,password:'changed-password-123'}})).cookie;
 mail.fail=true;await request('/api/account/verification',{method:'POST',cookie:changed,status:503});mail.fail=false;
 assert.equal(await db.db().collection('accounttokens').countDocuments({email:details.email}),0,'Provider failure must not leave a valid token');
 await request('/api/account/verification',{method:'POST',cookie:changed});const verification=tokenFrom(mail.messages.at(-1));
 const stored=await db.db().collection('accounttokens').findOne({email:details.email,purpose:'verify'});assert.ok(stored);assert.notEqual(stored.hash,verification);assert.equal(stored.hash,createHash('sha256').update(verification).digest('hex'));
 await request('/api/auth/reset',{method:'POST',body:{token:verification,newPassword:'wrong-purpose-123'},status:400});
 await request('/api/auth/verify',{method:'POST',body:{token:verification}});assert.equal((await request('/api/me',{cookie:changed})).data.user.emailVerified,true);
 await request('/api/auth/verify',{method:'POST',body:{token:verification},status:400});await request('/api/account/verification',{method:'POST',cookie:changed,status:409});
 const before=mail.messages.length;const unknown=(await request('/api/auth/recovery',{method:'POST',body:{email:'unknown@example.test'}})).data;
 assert.equal(mail.messages.length,before);
 const known=(await request('/api/auth/recovery',{method:'POST',body:{email:details.email}})).data;assert.deepEqual(unknown,known);
 const expired=tokenFrom(mail.messages.at(-1));await db.db().collection('accounttokens').updateOne({hash:createHash('sha256').update(expired).digest('hex')},{$set:{expiresAt:new Date(Date.now()-10000)}});
 await request('/api/auth/reset',{method:'POST',body:{token:expired,newPassword:'reset-password-123'},status:400});
 await request('/api/auth/recovery',{method:'POST',body:{email:details.email}});const reset=tokenFrom(mail.messages.at(-1));
 await request('/api/auth/reset',{method:'POST',body:{token:reset,newPassword:'reset-password-123'}});
 assert.equal((await request('/api/me',{cookie:changed})).data.user,null);
 await request('/api/auth/reset',{method:'POST',body:{token:reset,newPassword:'another-password-123'},status:400});
 const recovered=(await request('/api/auth/login',{method:'POST',body:{email:details.email,password:'reset-password-123'}})).cookie;
 const resetCount=await db.db().collection('accounttokens').countDocuments({email:details.email,purpose:'reset',usedAt:null,expiresAt:{$gt:new Date()}});assert.equal(resetCount,0);
 await request('/api/notifications',{status:401});
 const notes=(await request('/api/notifications',{cookie:seller})).data;assert.ok(notes.notifications.some(n=>n.type==='moderation'));assert.ok(notes.notifications.some(n=>n.type==='message'));
 const note=notes.notifications[0];await request('/api/notifications',{method:'PATCH',cookie:other,body:{id:note.id},status:404});await request('/api/notifications',{method:'PATCH',cookie:seller,body:{id:note.id}});
 assert.equal((await request('/api/notifications',{cookie:seller})).data.notifications.find(n=>n.id===note.id).read,true);
 assert.equal((await request('/api/notifications',{cookie:recovered})).data.notifications.length,0);
 assert.ok((await request('/api/notifications',{cookie:admin})).data.notifications.every(n=>n.id!==note.id));
 console.log('PASS: password change revokes sessions, email provider failure is truthful, tokens are hashed/purpose-bound/expiring/single-use, recovery is private and notifications enforce per-account access.');
 return {cookie:recovered,email:details.email,password:'reset-password-123'};
}
export async function verifyAccountsBrowser({page,context,origin,mail,security,capture,seller}){
 async function as(cookie){await context.addCookies([{name:'reuse_market_session',value:cookie.slice(cookie.indexOf('=')+1),url:origin,httpOnly:true,sameSite:'Lax'}]);}
 await as(security.cookie);await page.goto(origin+'/account/security');await page.getByText('Your email address is verified.',{exact:false}).waitFor();
 await page.getByLabel('Current password',{exact:true}).fill(security.password);await page.getByLabel('New password',{exact:true}).fill('browser-password-123');await page.getByLabel('Confirm new password',{exact:true}).fill('not-matching-123');await page.getByRole('button',{name:'Change password & sign out',exact:true}).click();await page.getByText('The new passwords do not match.',{exact:true}).waitFor();
 await page.getByLabel('Confirm new password',{exact:true}).fill('browser-password-123');await page.getByRole('button',{name:'Change password & sign out',exact:true}).click();await page.getByText('Password changed. Please log in again.',{exact:false}).waitFor();
 await page.goto(origin+'/forgot-password');await page.getByLabel('Account email',{exact:true}).fill(security.email);await page.getByRole('button',{name:'Request reset link',exact:true}).click();await page.getByText('For privacy, this response does not confirm an account or email delivery.',{exact:false}).waitFor();
 const token=tokenFrom(mail.messages.at(-1));await page.goto(`${origin}/reset-password?token=${token}`);await page.getByLabel('New password',{exact:true}).fill('browser-recovered-123');await page.getByLabel('Confirm new password',{exact:true}).fill('browser-recovered-123');await page.getByRole('button',{name:'Reset password',exact:true}).click();await page.getByText('Your password has been reset.',{exact:false}).waitFor();assert.ok(!new URL(page.url()).searchParams.has('token'));
 await page.goto(origin+'/login');await page.getByLabel('Email address',{exact:true}).fill(security.email);await page.getByLabel('Password',{exact:true}).fill('browser-recovered-123');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/dashboard');
 await as(seller);await page.goto(origin+'/notifications');await page.locator('.notification-card').first().waitFor();const unread=page.locator('.notification-unread').first();if(await unread.count()){await unread.getByRole('button',{name:'Mark as read',exact:true}).click();}
 for(const path of ['/notifications','/account/security','/forgot-password','/reset-password','/verify-email'])for(const width of [320,375,768,1440]){await page.setViewportSize({width,height:900});await page.goto(origin+path);await page.waitForLoadState('networkidle');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Account overflow ${path} at ${width}`);}
 await page.goto(origin+'/account/security');await page.setViewportSize({width:375,height:812});await capture('account-security-mobile');await page.goto(origin+'/notifications');await capture('notifications-mobile');
 console.log('PASS: browser password confirmation, session sign-out, real mock-provider recovery flow, cleared token URL, login with recovered password, notifications and responsive account pages.');
}
