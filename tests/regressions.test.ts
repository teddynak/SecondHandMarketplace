import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { safeDestination } from '../src/lib/client';
import { registerSchema, productSchema } from '../src/lib/validators';
import { boundedBody, jsonBody } from '../src/lib/security';

test('login destinations stay on this site', () => {
 for (const input of ['//evil.test', '/\\evil.test', '/\n/evil.test', 'https://evil.test', null]) assert.equal(safeDestination(input), '/dashboard');
 assert.equal(safeDestination('/sell?draft=1'), '/sell?draft=1');
});
test('registration normalizes email and rejects bcrypt truncation', () => {
 const input = { name:'Test User', email:' TEST@example.com ', password:'password123', phone:'0771234567', location:'Kampala' };
 assert.equal(registerSchema.parse(input).email, 'test@example.com');
 assert.equal(registerSchema.safeParse({...input, password:'😀'.repeat(20)}).success, false);
});
test('listing prices respect the database minimum and whole shillings', () => {
 const input = {title:'Test item', description:'A useful description of this item.', category:'Clothing', condition:'Used', price:1, location:'Kampala', sellerPhone:'0771234567', images:[]};
 assert.equal(productSchema.safeParse(input).success, true);
 for (const price of [0, 0.5, Infinity]) assert.equal(productSchema.safeParse({...input, price}).success, false);
});
test('body limits apply to bytes without trusting content-length', async () => {
 const request = new NextRequest('http://localhost/api', {method:'POST', body:'😀'.repeat(10)});
 await assert.rejects(boundedBody(request, 20), (error: unknown) => (error as {status:number}).status === 413);
 await assert.rejects(jsonBody(new NextRequest('http://localhost/api', {method:'POST',body:'{bad'})), /valid JSON/);
 assert.deepEqual(await jsonBody(new NextRequest('http://localhost/api', {method:'POST',body:'{"ok":true}'})), {ok:true});
});

test('image sources accept uploaded paths and HTTPS links only', async () => {
 const { isImageSource } = await import('../src/lib/image-source');
 for (const source of ['/api/images/0123456789abcdef01234567', 'https://images.example.test/photo.jpg?size=large']) assert.equal(isImageSource(source),true);
 for (const source of ['javascript:alert(1)','data:image/svg+xml,test','http://images.example.test/a.jpg','//images.example.test/a.jpg','https://user:password@images.example.test/a.jpg','/api/images/not-an-id']) assert.equal(isImageSource(source),false);
 const input={title:'Test item',description:'A useful description of this item.',category:'Clothing',condition:'Used',price:1,location:'Kampala',sellerPhone:'0771234567',images:['https://images.example.test/a.jpg']};
 assert.equal(productSchema.safeParse(input).success,true);
 assert.equal(productSchema.safeParse({...input,images:Array(5).fill(input.images[0])}).success,false);
 assert.equal(productSchema.safeParse({...input,images:[input.images[0],input.images[0]]}).success,false);
});

test('saved searches canonicalize filters and reject invalid ranges', async () => {
 const {canonicalSearch,searchLabel}=await import('../src/lib/search');
 assert.equal(canonicalSearch('location=Kampala&maxPrice=50000&category=Books&page=4'),canonicalSearch('category=Books&maxPrice=50000&location=Kampala'));
 assert.ok(!canonicalSearch('q=desk&page=2&redirect=https://example.test').includes('redirect'));
 assert.throws(()=>canonicalSearch('minPrice=500&maxPrice=10'),/Minimum/);
 assert.throws(()=>canonicalSearch('maxPrice=Infinity'),/Invalid price/);
 assert.throws(()=>canonicalSearch('category=Unknown'),/Invalid category/);
 assert.match(searchLabel('location=Kampala&category=Books'),/Books.*Kampala/);
});

test('photo ordering changes cover without mutating or losing photos', async () => {
 const {movePhoto}=await import('../src/lib/photos');
 const photos=['first','second','third'];
 assert.deepEqual(movePhoto(photos,2,0),['third','first','second']);
 assert.deepEqual(movePhoto(photos,0,1),['second','first','third']);
 assert.deepEqual(movePhoto(photos,1,2),['first','third','second']);
 assert.deepEqual(photos,['first','second','third']);
 assert.equal(movePhoto(photos,-1,0),photos);assert.equal(movePhoto(photos,0,9),photos);
});
test('listing status explanations match available actions', async () => {
 const {listingStatusDescription}=await import('../src/lib/listing-status');
 assert.match(listingStatusDescription({status:'available',paymentStatus:'unpaid',deletionRequestStatus:'pending'}),/awaiting administrator review/);
 assert.match(listingStatusDescription({status:'sold',paymentStatus:'unpaid'}),/cannot be edited.*mark payment/);
 assert.match(listingStatusDescription({status:'archived',paymentStatus:'paid'}),/hidden from buyers/);
});


test('used-only listings default silently and explicitly new listings are rejected',()=>{
 const input={title:'Used table',description:'A table that has been used for two years.',category:'Furniture',price:40000,location:'Kampala',sellerPhone:'0771234567',images:[]};
 assert.equal(productSchema.parse(input).condition,'Used');
 assert.equal(productSchema.safeParse({...input,condition:'New'}).success,false);
});
test('legacy condition filters are omitted when reopening a saved search',async()=>{
 const {canonicalSearch,searchLabel}=await import('../src/lib/search');
 assert.equal(canonicalSearch('q=table&condition=New&location=Kampala'),'q=table&location=Kampala');
 assert.ok(!searchLabel(canonicalSearch('condition=Good&category=Furniture')).includes('Good'));
});


test('messages require text and a stable UUID and bound report evidence input',async()=>{
 const {sendMessageSchema,reportConversationSchema,readMessagesSchema}=await import('../src/lib/messaging-validation');
 const clientId='65df245e-bd41-4b8e-a77f-015b47c56e55';
 assert.equal(sendMessageSchema.parse({text:'  Is it available?  ',clientId}).text,'Is it available?');
 for(const text of ['   ','x'.repeat(2001)])assert.equal(sendMessageSchema.safeParse({text,clientId}).success,false);
 assert.equal(sendMessageSchema.safeParse({text:'Hi',clientId:'wrong'}).success,false);
 assert.equal(reportConversationSchema.safeParse({conversationId:'0123456789abcdef01234567',reason:'Short'}).success,false);
 assert.equal(reportConversationSchema.safeParse({conversationId:'invalid',reason:'A detailed report reason'}).success,false);
 for(const through of [-1,0,1.5,Infinity])assert.equal(readMessagesSchema.safeParse({through}).success,false);
});


test('moderation decisions require a target, known action and a real reason',async()=>{
 const {moderationSchema,entityReportSchema}=await import('../src/lib/moderation-validation');
 const targetId='0123456789abcdef01234567';
 assert.equal(moderationSchema.safeParse({action:'suspend',targetId,reason:'Account review found an issue.'}).success,true);
 assert.equal(moderationSchema.safeParse({action:'delete-everything',targetId,reason:'Account review found an issue.'}).success,false);
 assert.equal(moderationSchema.safeParse({action:'suspend',targetId,reason:'Short'}).success,false);
 assert.equal(entityReportSchema.safeParse({kind:'user',targetId,reason:'A clear report for an administrator.'}).success,true);
});
