import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

// Isolated replica set: never reads or modifies the operator's real database.
const mongo = await MongoMemoryReplSet.create({ binary: { version: process.env.MONGOMS_VERSION || '7.0.24' }, replSet: { count: 1, storageEngine: 'wiredTiger' } });
const uri = mongo.getUri('reuse_integration');
const port = process.env.TEST_PORT || '3100';
const origin = `http://localhost:${port}`;
let logs = '';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', port], {
 env: { ...process.env, MONGODB_URI: uri, AUTH_SECRET: 'isolated-integration-secret-with-at-least-32-characters', NODE_ENV: 'production' },
 stdio: ['ignore','pipe','pipe'],
});
server.stdout.on('data', data => { logs += data; });
server.stderr.on('data', data => { logs += data; });
const db = new MongoClient(uri);
let browser;
async function request(path, {cookie, method='GET', body, status=200}={}) {
 const headers = { Origin: origin };
 if (cookie) headers.Cookie = cookie;
 if (body && !(body instanceof FormData)) headers['Content-Type']='application/json';
 const response = await fetch(`${origin}${path}`, {method,headers,body: body instanceof FormData ? body : body ? JSON.stringify(body):undefined});
 const data = await response.json();
 assert.equal(response.status,status,`${method} ${path}: ${JSON.stringify(data)}`);
 return {data,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
try {
 for(let i=0;i<120;i++) {
  try { const response=await fetch(`${origin}/api/health`); if(response.ok)break; } catch {}
  if(i===119)throw new Error(`Server failed to start: ${logs}`);
  await delay(500);
 }
 await db.connect();
 const account = name => ({name,email:`${name.toLowerCase()}@example.test`,password:'test-password-123',phone:'0771234567',location:'Kampala'});
 const seller=(await request('/api/auth/register',{method:'POST',body:account('Seller'),status:201})).cookie;
 const other=(await request('/api/auth/register',{method:'POST',body:account('Other'),status:201})).cookie;
 const admin=(await request('/api/auth/register',{method:'POST',body:account('Admin'),status:201})).cookie;
 await db.db().collection('users').updateOne({email:'admin@example.test'},{$set:{role:'admin'}});
 await request('/api/auth/login',{method:'POST',body:{email:'seller@example.test',password:'wrong-password'},status:401});
 await request('/api/auth/login',{method:'POST',body:{email:'seller@example.test',password:'test-password-123'}});
 const photo = new FormData();
 photo.append('file',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64'),Buffer.alloc(100)],{type:'image/png'}),'item.png');
 const upload=(await request('/api/uploads',{method:'POST',cookie:seller,body:photo,status:201})).data;
 const imageResponse=await fetch(`${origin}${upload.url}`); assert.equal(imageResponse.status,200); assert.equal(imageResponse.headers.get('content-type'),'image/png');
 const item={title:'Second hand desk',description:'A sturdy desk in good condition, ready for a new home.',category:'Furniture',condition:'Good',price:90000,location:'Kampala',sellerPhone:'0771234567',images:[upload.url]};
 await request('/api/items',{method:'POST',body:item,status:401});
 await request('/api/items',{method:'POST',cookie:other,body:item,status:403});
 const created=(await request('/api/items',{method:'POST',cookie:seller,body:item,status:201})).data.item;
 assert.equal((await request('/api/me',{cookie:seller})).data.user.role,'seller');
 assert.equal((await request(`/api/items/${created.id}`)).data.item.title,item.title);
 const updated=(await request(`/api/items/${created.id}`,{method:'PATCH',cookie:seller,body:{price:75000,title:'Updated second hand desk'}})).data.item;
 assert.equal(updated.price,75000);
 await request(`/api/items/${created.id}`,{method:'PATCH',cookie:other,body:{price:1},status:403});
 assert.equal((await request('/api/items?q=Updated&minPrice=70000&maxPrice=80000')).data.total,1);
 await request('/api/items?minPrice=80000&maxPrice=70000',{status:400});
 await request('/api/deletion-requests',{method:'POST',cookie:other,body:{productId:created.id,reason:'Please remove this listing.'},status:403});
 const removal=(await request('/api/deletion-requests',{method:'POST',cookie:seller,body:{productId:created.id,reason:'Please remove this listing.'},status:201})).data;
 await request('/api/deletion-requests',{method:'POST',cookie:seller,body:{productId:created.id,reason:'Duplicate request for removal.'},status:409});
 await request(`/api/admin/deletion-requests/${removal.id}`,{method:'PATCH',cookie:seller,body:{decision:'approved'},status:403});
 await request(`/api/admin/deletion-requests/${removal.id}`,{method:'PATCH',cookie:admin,body:{decision:'rejected'}});
 assert.equal((await request(`/api/items/${created.id}`)).data.item.status,'available');
 const second=(await request('/api/deletion-requests',{method:'POST',cookie:seller,body:{productId:created.id,reason:'Please archive my listing.'},status:201})).data;
 await request(`/api/admin/deletion-requests/${second.id}`,{method:'PATCH',cookie:admin,body:{decision:'approved'}});
 await request(`/api/items/${created.id}`,{status:404});
 assert.equal((await request(`/api/items/${created.id}`,{cookie:seller})).data.item.status,'archived');
 await request(`/api/admin/deletion-requests/${second.id}`,{method:'PATCH',cookie:admin,body:{decision:'rejected'},status:409});
 const sale=(await request('/api/items',{method:'POST',cookie:seller,body:{...item,title:'Desk for sale'},status:201})).data.item;
 await request(`/api/items/${sale.id}`,{method:'PATCH',cookie:seller,body:{action:'complete-sale',paid:false}});
 await request(`/api/items/${sale.id}`,{method:'PATCH',cookie:seller,body:{action:'mark-paid'}});
 assert.equal((await request(`/api/items/${sale.id}`,{cookie:seller})).data.item.paymentStatus,'paid');
 assert.equal((await request('/api/items')).data.total,0);
 await request('/api/me',{method:'PATCH',cookie:seller,body:{name:'Seller Updated',phone:'0777654321',location:'Entebbe'}});
 assert.equal((await request('/api/my/items',{cookie:seller})).data.items[0].sellerName,'Seller Updated');
 const linked=(await request('/api/items',{method:'POST',cookie:seller,body:{...item,title:'Linked image listing',images:['https://images.unsplash.com/photo-1503602642458-232111445657?w=400']},status:201})).data.item;
 await request(`/api/items/${linked.id}`,{method:'PATCH',cookie:seller,body:{images:[linked.images[0],upload.url]}});
 assert.equal((await request(`/api/items/${linked.id}`)).data.item.images.length,2);
 await request(`/api/items/${linked.id}`,{method:'PATCH',cookie:other,body:{images:[upload.url]},status:403});
 await request('/api/items',{method:'POST',cookie:seller,body:{...item,images:['http://example.test/image.jpg']},status:400});
 await request('/api/items',{method:'POST',cookie:seller,body:{...item,images:['javascript:alert(1)']},status:400});
 console.log('PASS: linked and uploaded images work together, unsafe links and unauthorized edits are rejected.');
 console.log('PASS: registration, login, image upload/read, listing CRUD, search, ownership, role upgrade, admin rejection/approval, archived visibility, sales, payment status and profile updates.');
 // A visible item for responsive UI checks.
 await request('/api/items',{method:'POST',cookie:seller,body:{...item,title:'A community desk ready for another story'},status:201});
 if(process.env.BROWSER_CHECKS==='1') {
  const { chromium }=await import('playwright');
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || undefined,args:['--no-sandbox']});
  const context=await browser.newContext();
  const page=await context.newPage();
  const widths=[320,375,768,1024,1440,1920];
  for(const width of widths) {
   await page.setViewportSize({width,height:900});
   for(const path of ['/','/marketplace','/login','/register','/about','/how-it-works']) {
    await page.goto(origin+path);await page.waitForLoadState('networkidle');
    const dimensions=await page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert.ok(dimensions.body<=dimensions.viewport+1,`Overflow at ${width}px on ${path}: ${JSON.stringify(dimensions)}`);
    if(path==='/') {
     const overlap=await page.locator('.category-card').evaluateAll(cards=>cards.some(card=>{
      const art=card.querySelector('.category-art').getBoundingClientRect();
      const title=card.querySelector('h3').getBoundingClientRect();
      return art.left<title.right && art.right>title.left && art.top<title.bottom && art.bottom>title.top;
     }));
     assert.equal(overlap,false,`Category artwork overlaps labels at ${width}px`);
    }
   }
  }
  await page.setViewportSize({width:375,height:812});await page.goto(origin);
  await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Explore marketplace'}).click();
  await page.waitForURL('**/marketplace');await page.getByRole('button',{name:'Filters',exact:true}).click();
  await page.getByRole('button',{name:'Close filters'}).click();
  const token=seller.slice(seller.indexOf('=')+1);
  await context.addCookies([{name:'reuse_market_session',value:token,url:origin,httpOnly:true,sameSite:'Lax'}]);
  for(const width of widths) {
   await page.setViewportSize({width,height:900});
   for(const path of ['/dashboard','/sell',`/items/${sale.id}`,`/dashboard/edit/${created.id}`]) {
    await page.goto(origin+path);await page.waitForLoadState('networkidle');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Signed-in overflow at ${width}px on ${path}`);
   }
  }
  await page.goto(origin+'/dashboard');await page.getByRole('button',{name:'Edit profile',exact:true}).click();
  await page.locator('#profile-name').fill('Browser Seller');await page.getByRole('button',{name:'Save profile'}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.goto(origin+'/sell');
  await page.locator('#image-url').fill('https://images.unsplash.com/photo-1503602642458-232111445657?w=400');
  await page.getByRole('button',{name:'Add image link',exact:true}).click();
  await page.locator('input[type=file]').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.concat([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64'),Buffer.alloc(100)])});
  await page.locator('.upload-preview').nth(1).waitFor();
  await page.locator('#title').fill('Browser created chair');
  await page.locator('#description').fill('A comfortable chair created using the real listing form.');
  await page.locator('#price').fill('65000');
  await page.getByRole('button',{name:'Publish listing'}).click();
  await page.waitForURL('**/items/**');
  const browserItemId=new URL(page.url()).pathname.split('/').pop();
  await page.goto(`${origin}/dashboard/edit/${browserItemId}`);
  await page.locator('#title').fill('Browser updated chair');
  await page.getByRole('button',{name:'Save changes'}).click();
  await page.waitForURL('**/items/**');
  await page.getByRole('heading',{name:'Browser updated chair',exact:true}).waitFor();
  await page.goto(origin+'/dashboard');
  const row=page.locator('.dashboard-item').filter({hasText:'Browser updated chair'});
  await row.getByRole('button',{name:'Request removal'}).click();
  await page.getByRole('dialog').locator('textarea').fill('Browser test removal after editing the listing.');
  await page.getByRole('button',{name:'Submit request'}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await context.addCookies([{name:'reuse_market_session',value:admin.slice(admin.indexOf('=')+1),url:origin,httpOnly:true,sameSite:'Lax'}]);
  await page.goto(origin+'/admin');
  const requestRow=page.locator('.request-card').filter({hasText:'Browser updated chair'});
  await requestRow.getByRole('button',{name:'Approve & archive'}).click();
  await requestRow.locator('.badge-approved').waitFor();
  for(const width of widths){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Admin overflow at ${width}px`);}
  console.log('PASS: browser forms create, read, edit, request removal and admin archive.');
  console.log('PASS: responsive overflow checks at 320, 375, 768, 1024, 1440 and 1920px; mobile menu/filters and profile form interactions.');
  if(process.env.SCREENSHOT_DIR) {
   const {mkdir}=await import('node:fs/promises');await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});
   for(const [name,width] of [['desktop',1440],['mobile',375]]) {await page.setViewportSize({width,height:1000});await page.goto(origin);await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/${name}.png`,fullPage:true});}
  }
  await browser.close();browser=undefined;
 }
 async function runSeed(storeImages=false) {
  const child=spawn(process.execPath,['--import','tsx','scripts/seed.ts',...(storeImages?['--store-images']:[])],{env:{...process.env,MONGODB_URI:uri,SEED_PASSWORD:'integration-demo-private-password'},stdio:['ignore','pipe','pipe']});
  let output='';child.stdout.on('data',data=>{output+=data;});child.stderr.on('data',data=>{output+=data;});
  await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`Seed failed: ${output}`)));});
  console.log(output);
 }
 const setup=spawn(process.execPath,['--import','tsx','scripts/setup-admin.ts'],{env:{...process.env,MONGODB_URI:uri,ADMIN_EMAIL:'owner@example.test',ADMIN_PASSWORD:'prototype-admin-123'},stdio:'ignore'});
 await new Promise((resolve,reject)=>{setup.on('error',reject);setup.on('exit',code=>code===0?resolve():reject(new Error(`Admin setup exit ${code}`)));});
 const owner=await request('/api/auth/login',{method:'POST',body:{email:'owner@example.test',password:'prototype-admin-123'}});
 assert.equal(owner.data.user.role,'admin');
 console.log('PASS: configured admin account can sign in.');
 await runSeed();
 const counts=await Promise.all(['users','products','imageassets'].map(name=>db.db().collection(name).countDocuments()));
 const demo=await db.db().collection('products').findOne({title:'Compact study desk'});
 assert.ok(demo);
 await db.db().collection('products').updateOne({_id:demo._id},{$set:{title:'My edited demo desk'}});
 await runSeed();
 assert.deepEqual(await Promise.all(['users','products','imageassets'].map(name=>db.db().collection(name).countDocuments())),counts);
 assert.equal((await db.db().collection('products').findOne({_id:demo._id})).title,'My edited demo desk');
 await runSeed(true);
 assert.deepEqual(await Promise.all(['users','products'].map(name=>db.db().collection(name).countDocuments())),counts.slice(0,2));
 console.log('PASS: seed is repeatable, preserves listing edits, and supports catalog images stored in MongoDB.');
 await request('/api/auth/logout',{method:'POST',cookie:seller});
 console.log('Integration checks completed.');
} catch(error) { console.error(logs); throw error; }
finally {
 if(browser)await browser.close();
 server.kill('SIGTERM');
 await db.close();await mongo.stop();
}
