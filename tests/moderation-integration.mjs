import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
export async function verifyModeration({request,seller,other,admin,linked,messaging,created}){
 await request('/api/admin/moderation',{cookie:other,status:403});
 await request('/api/admin/moderation',{status:401});
 const reason='Reviewed a detailed community moderation issue.';
 const listingReport=(await request('/api/entity-reports',{method:'POST',cookie:other,body:{kind:'listing',targetId:linked.id,reason},status:201})).data;
 await request('/api/entity-reports',{method:'POST',cookie:other,body:{kind:'listing',targetId:linked.id,reason},status:409});
 await request('/api/entity-reports',{method:'POST',cookie:seller,body:{kind:'listing',targetId:linked.id,reason},status:400});
 await request('/api/entity-reports',{method:'POST',cookie:other,body:{kind:'user',targetId:messaging.sellerId,reason},status:201});
 await request('/api/entity-reports',{method:'POST',cookie:seller,body:{kind:'user',targetId:messaging.sellerId,reason},status:400});
 await request('/api/admin/moderation',{method:'PATCH',cookie:other,body:{action:'suspend',targetId:messaging.sellerId,reason},status:403});
 await request('/api/admin/moderation',{method:'PATCH',cookie:admin,body:{action:'suspend',targetId:messaging.sellerId,reason:'Short'},status:400});
 const ownId=(await request('/api/me',{cookie:admin})).data.user.id;
 await request('/api/admin/moderation',{method:'PATCH',cookie:admin,body:{action:'suspend',targetId:ownId,reason},status:403});
 await request('/api/admin/moderation',{method:'PATCH',cookie:admin,body:{action:'hide-listing',targetId:linked.id,reason}});
 await request(`/api/items/${linked.id}`,{status:404});assert.ok(!(await request('/api/items')).data.items.some(i=>i.id===linked.id));
 assert.equal((await request(`/api/items/${linked.id}`,{cookie:seller})).data.item.moderationHidden,true);
 assert.equal((await request(`/api/conversations/${messaging.conversationId}`,{cookie:other})).data.conversation.canSend,false);
 await request(`/api/conversations/${messaging.conversationId}/messages`,{method:'POST',cookie:other,body:{text:'Hidden items cannot receive messages.',clientId:randomUUID()},status:409});
 await request(`/api/items/${linked.id}`,{method:'PATCH',cookie:seller,body:{moderationHidden:false,title:'Linked image listing'}});
 assert.equal((await request(`/api/items/${linked.id}`,{cookie:seller})).data.item.moderationHidden,true);
 await request('/api/admin/moderation',{method:'PATCH',cookie:admin,body:{action:'suspend',targetId:messaging.sellerId,reason}});
 assert.equal((await request('/api/me',{cookie:seller})).data.user.accountStatus,'suspended');
 await request('/api/my/items',{cookie:seller,status:403});
 await request('/api/auth/login',{method:'POST',body:{email:'seller@example.test',password:'test-password-123'},status:403});
 await request(`/api/sellers/${messaging.sellerId}`,{status:404});
 assert.ok(!(await request('/api/items')).data.items.some(i=>i.sellerId===messaging.sellerId));
 await request('/api/admin/moderation',{method:'PATCH',cookie:admin,body:{action:'restore-account',targetId:messaging.sellerId,reason:'Account review completed and access may resume.'}});
 assert.equal((await request('/api/me',{cookie:seller})).data.user.accountStatus,'active');
 assert.equal((await request(`/api/items/${created.id}`,{cookie:seller})).data.item.status,'archived');
 await request(`/api/items/${linked.id}`,{status:404});
 await request('/api/admin/moderation',{method:'PATCH',cookie:admin,body:{action:'restore-listing',targetId:linked.id,reason:'Listing reviewed and moderation hold can be removed.'}});
 assert.equal((await request(`/api/items/${linked.id}`)).data.item.publiclyVisible,true);
 await request('/api/admin/moderation',{method:'PATCH',cookie:admin,body:{action:'review-report',targetId:listingReport.id,reason}});
 await request('/api/admin/moderation',{method:'PATCH',cookie:admin,body:{action:'review-report',targetId:listingReport.id,reason},status:409});
 const audit=(await request('/api/admin/moderation?tab=audit',{cookie:admin})).data;
 for(const action of ['suspend','restore-account','hide-listing','restore-listing','review-report','review-conversation-report'])assert.ok(audit.rows.some(r=>r.title===action),`Missing audit ${action}`);
 const reportQueue=(await request('/api/admin/moderation?tab=reports',{cookie:admin})).data;
 assert.ok(reportQueue.rows.some(r=>r.kind==='user'&&r.status==='pending'));
 assert.equal((await request('/api/admin/moderation?tab=users&q=seller@example.test',{cookie:admin})).data.rows.length,1);
 assert.equal((await request('/api/admin/moderation?tab=listings&q=Linked%20image',{cookie:admin})).data.rows.length,1);
 console.log('PASS: listing/member reports, admin permissions, protected admin accounts, moderation hiding, suspension/login enforcement, restoration without relisting archived data and transactional audit events.');
}
export async function verifyModerationBrowser({page,context,origin,admin,other,linked,sellerId,capture}){
 async function as(cookie){await context.addCookies([{name:'reuse_market_session',value:cookie.slice(cookie.indexOf('=')+1),url:origin,httpOnly:true,sameSite:'Lax'}]);}
 await as(other);await page.goto(`${origin}/sellers/${sellerId}`);await page.getByRole('button',{name:'Report member',exact:true}).click();
 let dialog=page.getByRole('dialog');await dialog.getByLabel('Report details',{exact:true}).fill('Browser report of a member for administrator review.');await dialog.getByRole('button',{name:'Submit report',exact:true}).click();
 // A pending server-side report already exists for this member: show its real error rather than fake success.
 await dialog.getByText('Your report for this item or member is already awaiting review.',{exact:true}).waitFor();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.goto(`${origin}/items/${linked.id}`);await page.getByRole('button',{name:'Report listing',exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByLabel('Report details',{exact:true}).fill('Browser listing report with a clear explanation.');await dialog.getByRole('button',{name:'Submit report',exact:true}).click();await dialog.waitFor({state:'hidden'});await page.getByText('Report submitted for administrator review.',{exact:true}).waitFor();
 await as(admin);await page.goto(origin+'/admin');await page.getByRole('button',{name:'Members',exact:true}).click();await page.getByLabel('Search members by name or email',{exact:true}).fill('seller@example.test');await page.getByRole('button',{name:'Search',exact:true}).click();
 const member=page.locator('.moderation-row').filter({hasText:'seller@example.test'});await member.getByRole('button',{name:'Suspend account',exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByLabel('Decision reason',{exact:true}).fill('Browser moderation suspension with a recorded reason.');await dialog.getByRole('button',{name:'Confirm decision',exact:true}).click();await dialog.waitFor({state:'hidden'});await member.getByRole('button',{name:'Restore account',exact:true}).waitFor();
 await member.getByRole('button',{name:'Restore account',exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByLabel('Decision reason',{exact:true}).fill('Browser moderation restoration after account review.');await dialog.getByRole('button',{name:'Confirm decision',exact:true}).click();await dialog.waitFor({state:'hidden'});await member.getByRole('button',{name:'Suspend account',exact:true}).waitFor();
 await page.getByRole('button',{name:'Audit history',exact:true}).click();await page.locator('.moderation-row').filter({hasText:'restore-account'}).first().waitFor();
 for(const width of [320,375,768,1024,1440,1920]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Moderation overflow at ${width}`);}
 await page.setViewportSize({width:375,height:812});await capture('moderation-mobile');
 console.log('PASS: browser listing/member report feedback, account suspend/restore confirmation and responsive audit history.');
}
