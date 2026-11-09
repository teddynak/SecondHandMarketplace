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
