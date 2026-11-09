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
 const input = {title:'Test item', description:'A useful description of this item.', category:'Clothing', condition:'Good', price:1, location:'Kampala', sellerPhone:'0771234567', images:[]};
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
 const input={title:'Test item',description:'A useful description of this item.',category:'Clothing',condition:'Good',price:1,location:'Kampala',sellerPhone:'0771234567',images:['https://images.example.test/a.jpg']};
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
