import assert from 'node:assert/strict';
import {verifyMessaging,verifyMessagingBrowser} from './messaging-integration.mjs';
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
let browserPage;
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
 const item={title:'Second hand desk',description:'A sturdy desk in good condition, ready for a new home.',category:'Furniture',condition:'Used',price:90000,location:'Kampala',sellerPhone:'0771234567',images:[upload.url]};
 await request('/api/items',{method:'POST',body:item,status:401});
 await request('/api/items',{method:'POST',cookie:other,body:item,status:403});
 const created=(await request('/api/items',{method:'POST',cookie:seller,body:item,status:201})).data.item;
 assert.equal((await request('/api/me',{cookie:seller})).data.user.role,'seller');
 assert.ok(!('condition' in created));
 await request('/api/items',{method:'POST',cookie:seller,body:{...item,condition:'New'},status:400});
 const legacyId=(await db.db().collection('products').insertOne({...item,title:'Legacy new item hidden by policy',condition:'New',sellerId:new (await import('mongodb')).ObjectId(created.sellerId),sellerName:'Seller',sellerEmail:'seller@example.test',status:'available',paymentStatus:'unpaid',createdAt:new Date(),updatedAt:new Date()})).insertedId;
 assert.ok(!(await request('/api/items')).data.items.some(product=>product.id===String(legacyId)));
 await request(`/api/items/${legacyId}`,{status:404});
 assert.equal((await request(`/api/items/${legacyId}`,{cookie:seller})).data.item.usedOnlyEligible,false);
 assert.ok(!(await request(`/api/sellers/${created.sellerId}`)).data.items.some(product=>product.id===String(legacyId)));
 await db.db().collection('products').deleteOne({_id:legacyId});

 assert.equal((await request(`/api/items/${created.id}`)).data.item.title,item.title);
 const updated=(await request(`/api/items/${created.id}`,{method:'PATCH',cookie:seller,body:{price:75000,title:'Updated second hand desk'}})).data.item;
 assert.equal(updated.price,75000);
 await request(`/api/items/${created.id}`,{method:'PATCH',cookie:other,body:{price:1},status:403});
 assert.equal((await request('/api/items?q=Updated&minPrice=70000&maxPrice=80000')).data.total,1);
 await request('/api/items?minPrice=80000&maxPrice=70000',{status:400});
 await request('/api/favorites',{status:401});
 await request('/api/favorites',{method:'POST',cookie:seller,body:{productId:created.id}});
 await request('/api/favorites',{method:'POST',cookie:seller,body:{productId:created.id}});
 assert.equal((await request('/api/favorites',{cookie:seller})).data.ids.length,1);
 assert.equal((await request('/api/favorites',{cookie:other})).data.ids.length,0);
 assert.equal((await request('/api/favorites',{cookie:seller})).data.items[0].id,created.id);
 await request('/api/favorites',{method:'DELETE',cookie:other,body:{productId:created.id}});
 assert.equal((await request('/api/favorites',{cookie:seller})).data.items.length,1);
 const savedSearch=(await request('/api/saved-searches',{method:'POST',cookie:seller,body:{params:'location=Kampala&category=Furniture&maxPrice=100000&page=9'}})).data;
 await request('/api/saved-searches',{method:'POST',cookie:seller,body:{params:'maxPrice=100000&category=Furniture&location=Kampala'}});
 assert.equal((await request('/api/saved-searches',{cookie:seller})).data.searches.length,1);
 assert.ok(!savedSearch.params.includes('page='));
 assert.equal((await request('/api/saved-searches',{cookie:other})).data.searches.length,0);
 await request('/api/saved-searches',{method:'DELETE',cookie:other,body:{id:savedSearch.id}});
 assert.equal((await request('/api/saved-searches',{cookie:seller})).data.searches.length,1);
 await request('/api/saved-searches',{method:'DELETE',cookie:seller,body:{id:savedSearch.id}});
 await request('/api/saved-searches',{method:'POST',cookie:seller,body:{params:'minPrice=90000&maxPrice=1'},status:400});
 assert.equal((await request('/api/items?location=Kampala')).data.total,1);
 assert.equal((await request('/api/items?location=Entebbe')).data.total,0);
 assert.equal((await request('/api/items?location=.*')).data.total,0);
 const lastPage=(await request('/api/items?page=9999&limit=1')).data;
 assert.equal(lastPage.page,lastPage.pages);assert.equal(lastPage.items.length,1);
 const emptyPage=(await request('/api/items?q=definitely-no-such-item&page=9999')).data;assert.equal(emptyPage.page,1);assert.equal(emptyPage.total,0);
 const storefront=(await request(`/api/sellers/${created.sellerId}`)).data;
 assert.equal(storefront.items.length,1);assert.ok(!('email' in storefront.seller));assert.ok(!('passwordHash' in storefront.seller));
 console.log('PASS: favorites and saved searches persist without duplicates, stay private per account, and location/seller filters work.');
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
 assert.equal((await request('/api/favorites',{cookie:seller})).data.items.length,0);
 await request('/api/favorites',{method:'POST',cookie:seller,body:{productId:created.id},status:404});
 await request('/api/favorites',{method:'DELETE',cookie:seller,body:{productId:created.id}});
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
 const messaging=await verifyMessaging({request,db,seller,other,admin,item,linked});
 console.log('PASS: registration, login, image upload/read, listing CRUD, search, ownership, role upgrade, admin rejection/approval, archived visibility, sales, payment status and profile updates.');
 // A visible item for responsive UI checks.
 await request('/api/items',{method:'POST',cookie:seller,body:{...item,title:'A community desk ready for another story'},status:201});
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
 if(process.env.BROWSER_CHECKS==='1') {
  const { chromium }=await import('playwright');
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || undefined,args:['--no-sandbox']});
  const context=await browser.newContext();
  const page=await context.newPage();browserPage=page;
  async function capture(name){if(!process.env.SCREENSHOT_DIR)return;const {mkdir}=await import('node:fs/promises');await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/${name}.png`});}
  const widths=[320,375,768,1024,1440,1920];
  for(const width of widths) {
   await page.setViewportSize({width,height:900});
   for(const path of ['/','/marketplace','/login','/register','/about','/how-it-works']) {
    await page.goto(origin+path);await page.waitForLoadState('networkidle');
    const dimensions=await page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert.ok(dimensions.body<=dimensions.viewport+1,`Overflow at ${width}px on ${path}: ${JSON.stringify(dimensions)}`);
    if(path==='/') {
     const columns=await page.locator('.discovery-feed .products-grid').evaluate(grid=>getComputedStyle(grid).gridTemplateColumns.split(' ').length);
     assert.ok(columns>=(width>=1800?7:width>=1280?6:width>=768?4:2),`Not enough compact columns at ${width}px: ${columns}`);
     assert.equal(await page.locator('.condition-chip').count(),0);

     const overlap=await page.locator('.category-card').evaluateAll(cards=>cards.some(card=>{
      const art=card.querySelector('.category-art').getBoundingClientRect();
      const title=card.querySelector('h3').getBoundingClientRect();
      return art.left<title.right && art.right>title.left && art.top<title.bottom && art.bottom>title.top;
     }));
     assert.equal(overlap,false,`Category artwork overlaps labels at ${width}px`);
     assert.equal(await page.locator('.category-card').count(),7);
     assert.equal(await page.locator('.category-card img:not([alt=""])').count(),0,'Category images must not duplicate the link name');
     const firstCategory=page.locator('.category-card').first();
     if(await firstCategory.locator('img').count())await firstCategory.locator('img').evaluate(image=>image.dispatchEvent(new Event('error')));
     await page.waitForTimeout(50);
     assert.equal(await firstCategory.locator('img').count(),0,'Broken category photo should be removed');
     assert.ok(await firstCategory.locator('.category-icon').isVisible(),'Icon fallback must remain visible');
    }
   }
  }
  await page.setViewportSize({width:375,height:812});await page.goto(origin);
  await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Explore marketplace'}).click();
  await page.waitForURL('**/marketplace');await page.getByRole('button',{name:'Filters',exact:true}).click();
  await page.getByRole('button',{name:'Close filters'}).click();await page.getByRole('dialog',{name:'Filters',exact:true}).waitFor({state:'hidden'});
  assert.ok(await page.getByRole('button',{name:'Filters',exact:true}).evaluate(button=>button===document.activeElement));
  await page.getByRole('button',{name:'Filters',exact:true}).click();
  let filters=page.getByRole('dialog',{name:'Filters',exact:true});
  await filters.getByRole('button',{name:'Entebbe',exact:true}).click();
  await page.keyboard.press('Escape');await filters.waitFor({state:'hidden'});
  assert.ok(!new URL(page.url()).searchParams.has('location'));
  await page.getByRole('button',{name:'Filters',exact:true}).click();filters=page.getByRole('dialog',{name:'Filters',exact:true});
  assert.equal(await filters.getByLabel('Condition',{exact:true}).count(),0);
  assert.equal(await filters.getByLabel('Location',{exact:true}).inputValue(),'');
  await filters.getByLabel('Category',{exact:true}).selectOption('Furniture');
  await filters.getByRole('button',{name:'Kampala',exact:true}).click();
  await filters.getByLabel('Minimum',{exact:true}).fill('90000');await filters.getByLabel('Maximum',{exact:true}).fill('1000');
  await filters.getByRole('button',{name:'Apply filters',exact:true}).click();
  await filters.getByText('Maximum price must be at least the minimum price.',{exact:true}).waitFor();
  await filters.getByLabel('Maximum',{exact:true}).fill('100000');
  await capture('filters-mobile');
  await filters.getByRole('button',{name:'Apply filters',exact:true}).click();
  await page.waitForURL(url=>url.searchParams.get('location')==='Kampala'&&url.searchParams.get('minPrice')==='90000');
  await filters.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Remove location filter',exact:true}).click();await page.waitForURL(url=>!url.searchParams.has('location'));
  assert.equal(new URL(page.url()).searchParams.get('category'),'Furniture');
  console.log('PASS: mobile filters apply together, validate price ranges, cancel without changes and restore keyboard focus.');


  await page.goto(origin+'/how-it-works');
  await page.getByRole('searchbox',{name:'Search help articles'}).fill('photos');
  const photoSummary=page.locator('summary').filter({hasText:'Can I upload photos or use image links?'});
  await photoSummary.focus();await page.keyboard.press('Enter');
  await page.getByText('Both are supported, with four photos total per listing.',{exact:false}).waitFor();
  await page.getByRole('searchbox',{name:'Search help articles'}).fill('zzzxnevermatch');
  await page.getByRole('heading',{name:'No matching answers yet'}).waitFor();
  await page.getByRole('button',{name:'Show all help topics'}).click();
  await page.getByRole('button',{name:'Selling',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Selling',exact:true}).getAttribute('aria-pressed'),'true');
  await capture('help-centre-mobile');
  await page.goto(origin+'/about');await page.locator('.about-anchors a[href="#our-mission"]').click();
  assert.equal(new URL(page.url()).pathname,'/about');assert.equal(new URL(page.url()).hash,'#our-mission');
  await page.getByRole('heading',{name:'A local place for second chances.'}).waitFor();
  await capture('about-mission-mobile');
  console.log('PASS: searchable help topics and keyboard FAQ expansion work; About us and mission stay on one page.');
  const token=seller.slice(seller.indexOf('=')+1);
  await context.addCookies([{name:'reuse_market_session',value:token,url:origin,httpOnly:true,sameSite:'Lax'}]);
  for(const width of widths) {
   await page.setViewportSize({width,height:900});
   for(const path of ['/dashboard','/sell','/saved',`/sellers/${created.sellerId}`,`/items/${sale.id}`,`/dashboard/edit/${created.id}`,'/inbox',`/inbox/${messaging.conversationId}`]) {
    await page.goto(origin+path);await page.waitForLoadState('networkidle');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Signed-in overflow at ${width}px on ${path}`);
   }
  }
  await page.goto(origin+'/marketplace?q=A%20community%20desk');
  await page.getByRole('button',{name:'Save A community desk ready for another story',exact:true}).click();
  await page.getByRole('button',{name:'Remove A community desk ready for another story from saved items',exact:true}).waitFor();
  await page.reload();
  assert.equal(await page.getByRole('button',{name:'Remove A community desk ready for another story from saved items',exact:true}).getAttribute('aria-pressed'),'true');
  await page.goto(origin+'/saved');
  await page.getByRole('link',{name:'A community desk ready for another story',exact:true}).waitFor();
  await page.getByRole('button',{name:'Remove A community desk ready for another story from saved items',exact:true}).click();
  await page.getByRole('link',{name:'A community desk ready for another story',exact:true}).waitFor({state:'hidden'});
  await page.goto(origin+'/marketplace?category=Furniture&location=Kampala&maxPrice=100000');
  await page.getByRole('button',{name:'Save search',exact:true}).click();
  await page.getByText('Search saved. Reopen it from Saved items & searches.',{exact:true}).waitFor();
  await page.goto(origin+'/saved');
  await page.locator('.saved-search-item>a').click();
  await page.waitForURL('**/marketplace?**');
  assert.equal(new URL(page.url()).searchParams.get('location'),'Kampala');
  let allowSearch=false;const searchPredicate=url=>url.pathname==='/api/items';
  const searchFailure=route=>{if(route.request().method()==='GET'&&!allowSearch)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Search temporarily unavailable.'})});return route.continue();};
  await page.route(searchPredicate,searchFailure);
  await page.goto(origin+'/marketplace?q=A%20community%20desk');
  await page.getByText('Search temporarily unavailable.',{exact:true}).waitFor();
  allowSearch=true;await page.getByRole('button',{name:'Try again',exact:true}).click();
  await page.getByRole('link',{name:'A community desk ready for another story',exact:true}).waitFor();
  assert.equal(new URL(page.url()).searchParams.get('q'),'A community desk');await page.unroute(searchPredicate,searchFailure);
  console.log('PASS: browser favorites persist after reload and saved searches restore filters.');
  await page.goto(origin+'/dashboard');await page.getByRole('button',{name:'Edit profile',exact:true}).click();
  await page.locator('#profile-name').fill('Browser Seller');await page.getByRole('button',{name:'Save profile'}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.goto(origin+'/sell');
  await page.locator('#image-url').fill('https://images.unsplash.com/photo-1503602642458-232111445657?w=400');
  await page.getByRole('button',{name:'Add image link',exact:true}).click();
  await page.locator('input[type=file]').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.concat([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64'),Buffer.alloc(100)])});
  await page.locator('.upload-preview').nth(1).waitFor();
  assert.equal(await page.getByLabel('Condition',{exact:true}).count(),0);
  await page.locator('#title').fill('Browser created chair');
  await page.locator('#description').fill('A comfortable chair created using the real listing form.');
  await page.locator('#price').fill('65000');
  const uploadedCover=await page.locator('.upload-preview img').nth(1).getAttribute('src');
  await page.getByRole('button',{name:'Make photo 2 the cover',exact:true}).click();
  await page.waitForFunction(()=>document.activeElement?.id==='listing-photo-0');
  assert.equal(await page.locator('.upload-preview img').first().getAttribute('src'),uploadedCover);
  await page.getByRole('button',{name:'Move photo 1 later',exact:true}).click();
  assert.notEqual(await page.locator('.upload-preview img').first().getAttribute('src'),uploadedCover);
  await page.getByRole('button',{name:'Move photo 2 earlier',exact:true}).click();
  await page.getByRole('button',{name:'Review listing',exact:true}).click();
  let preview=page.getByRole('dialog',{name:'Preview your listing',exact:true});await preview.waitFor();
  assert.equal(await db.db().collection('products').countDocuments({title:'Browser created chair'}),0);
  assert.equal(await preview.locator('.listing-preview-photo img').getAttribute('src'),uploadedCover);
  for(const width of widths){await page.setViewportSize({width,height:900});assert.ok(await preview.evaluate(dialog=>{const rect=dialog.getBoundingClientRect();return rect.left>=0&&rect.right<=innerWidth+1&&rect.top>=0&&rect.bottom<=innerHeight+1;}),`Preview escapes viewport at ${width}`);}
  await page.setViewportSize({width:375,height:812});await capture('listing-preview-mobile');
  for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert.ok(await preview.evaluate(dialog=>dialog.contains(document.activeElement)),'Focus escaped listing preview');}
  await page.keyboard.press('Escape');await preview.waitFor({state:'hidden'});
  assert.ok(await page.getByRole('button',{name:'Review listing',exact:true}).evaluate(button=>button===document.activeElement));
  assert.equal(await page.locator('#title').inputValue(),'Browser created chair');
  await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:'Review listing',exact:true}).click();
  preview=page.getByRole('dialog',{name:'Preview your listing',exact:true});await preview.waitFor();await capture('listing-preview-desktop');
  let failPublish=true;
  await page.route('**/api/items',route=>{if(route.request().method()==='POST'&&failPublish){failPublish=false;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporary publish failure. Please retry.'})});}return route.continue();});
  await preview.getByRole('button',{name:'Publish listing',exact:true}).click();
  await preview.getByText('Temporary publish failure. Please retry.',{exact:true}).waitFor();
  assert.equal(await db.db().collection('products').countDocuments({title:'Browser created chair'}),0);
  await preview.getByRole('button',{name:'Publish listing',exact:true}).click();
  await page.waitForURL('**/items/**');
  await page.unroute('**/api/items');
  const browserItemId=new URL(page.url()).pathname.split('/').pop();
  assert.equal((await request(`/api/items/${browserItemId}`)).data.item.images[0],uploadedCover);
  console.log('PASS: photo cover/reordering persists, previews do not publish, dialogs contain focus, and failed publishing retries safely.');
  await page.goto(`${origin}/dashboard/edit/${browserItemId}`);
  await page.locator('#title').fill('Browser updated chair');
  await page.getByRole('button',{name:'Review changes',exact:true}).click();
  await page.getByRole('dialog',{name:'Review your changes',exact:true}).getByRole('button',{name:'Save changes',exact:true}).click();
  await page.waitForURL('**/items/**');
  await page.getByRole('heading',{name:'Browser updated chair',exact:true}).waitFor();
  await page.goto(origin+'/dashboard');
  const row=page.locator('.dashboard-item').filter({hasText:'Browser updated chair'});
  await row.getByRole('button',{name:'Request removal'}).click();
  await page.getByRole('dialog').locator('textarea').fill('Browser test removal after editing the listing.');
  await page.getByRole('button',{name:'Submit request'}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  await row.getByText('Removal is awaiting administrator review.',{exact:false}).waitFor();
  assert.ok(await row.getByRole('button',{name:'Deletion pending',exact:true}).isDisabled());
  await context.addCookies([{name:'reuse_market_session',value:admin.slice(admin.indexOf('=')+1),url:origin,httpOnly:true,sameSite:'Lax'}]);
  await page.goto(origin+'/admin');
  const requestRow=page.locator('.request-card').filter({hasText:'Browser updated chair'});
  await requestRow.getByRole('button',{name:'Approve & archive'}).click();
  await requestRow.locator('.badge-approved').waitFor();
  for(const width of widths){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Admin overflow at ${width}px`);}
  await verifyMessagingBrowser({page,context,origin,request,db,seller,other,admin,linked,messaging,capture});
  console.log('PASS: browser forms create, read, edit, request removal and admin archive.');
  console.log('PASS: responsive overflow checks at 320, 375, 768, 1024, 1440 and 1920px; mobile menu/filters and profile form interactions.');
  if(process.env.SCREENSHOT_DIR) {
   const {mkdir}=await import('node:fs/promises');await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});
   for(const [name,width] of [['desktop',1440],['mobile',375]]) {await page.setViewportSize({width,height:1000});await page.goto(origin);await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/${name}.png`,fullPage:true});}
  }
  await browser.close();browser=undefined;
 }
 await request('/api/auth/logout',{method:'POST',cookie:seller});
 console.log('Integration checks completed.');
} catch(error) { if(browserPage&&process.env.SCREENSHOT_DIR){const {mkdir}=await import('node:fs/promises');await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});await browserPage.screenshot({path:`${process.env.SCREENSHOT_DIR}/failure.png`,fullPage:true}).catch(()=>{});} console.error(logs); throw error; }
finally {
 if(browser)await browser.close();
 server.kill('SIGTERM');
 await db.close();await mongo.stop();
}
