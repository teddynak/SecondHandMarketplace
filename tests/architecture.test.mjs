import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('frontend pages and backend routes are present',()=>{
 for(const f of ['src/app/page.tsx','src/app/marketplace/page.tsx','src/app/items/[id]/page.tsx','src/app/sell/page.tsx','src/app/dashboard/page.tsx','src/app/admin/page.tsx','src/app/api/items/route.ts','src/app/api/items/[id]/route.ts','src/app/api/auth/login/route.ts','src/app/api/deletion-requests/route.ts']) assert.ok(existsSync(new URL(`../${f}`,import.meta.url)),f);
});
test('a regular seller has no direct DELETE endpoint',()=>{
 assert.doesNotMatch(source('src/app/api/items/[id]/route.ts'),/export\s+(async\s+)?function\s+DELETE\s*\(/);
 assert.match(source('src/app/api/admin/deletion-requests/[id]/route.ts'),/requireAdmin\(\)/);
});
test('public marketplace excludes sold and archived listings',()=>{
 assert.match(source('src/app/api/items/route.ts'),/status: 'available'/);
 assert.match(source('src/app/api/items/[id]/route.ts'),/product\.status = 'sold'/);
});
test('no private database keys are committed',()=>{
 assert.ok(!existsSync(new URL('../.env.local',import.meta.url)));
 assert.match(source('.gitignore'),/\.env\.local/);
});
