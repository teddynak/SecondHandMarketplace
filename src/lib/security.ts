import { NextRequest } from 'next/server';
import { AppError } from './errors';
// Browsers send Origin on fetch mutations. Reject foreign origins, even with an existing session.
export function assertSameOrigin(request: NextRequest) {
 const origin = request.headers.get('origin');
 const site = request.headers.get('sec-fetch-site');
 if (site === 'cross-site') throw new AppError('Cross-site requests are not allowed.', 403);
 if (origin) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  let originHost: string;
  try { originHost = new URL(origin).host; } catch { throw new AppError('Invalid origin.', 403); }
  if (!host || originHost !== host) throw new AppError('Cross-origin requests are not allowed.', 403);
 }
}
export function validObjectId(value: string) { return /^[a-f\d]{24}$/i.test(value); }
export async function boundedBody(request: NextRequest, limit: number) {
 const reader = request.body?.getReader();
 if (!reader) return new Uint8Array();
 const chunks: Uint8Array[] = []; let size = 0;
 try {
  while (true) {
   const { done, value } = await reader.read();
   if (done) break;
   size += value.byteLength;
   if (size > limit) { await reader.cancel(); throw new AppError('Request body is too large.', 413); }
   chunks.push(value);
  }
 } finally { reader.releaseLock(); }
 const bytes = new Uint8Array(size); let offset = 0;
 for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
 return bytes;
}
export async function jsonBody(request: NextRequest) {
 const raw = new TextDecoder().decode(await boundedBody(request, 22_000));
 try { return JSON.parse(raw) as unknown; } catch { throw new AppError('Please send valid JSON.'); }
}
