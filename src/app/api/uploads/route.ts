import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError, AppError } from '@/lib/errors';
import { assertSameOrigin, boundedBody } from '@/lib/security';
import ImageAsset from '@/models/ImageAsset';
export const runtime = 'nodejs';
function detectedImageType(buffer: Buffer): string | null {
 if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
 if (buffer.length >= 8 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
 if (buffer.length >= 12 && buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP') return 'image/webp';
 return null;
}
export async function POST(request: NextRequest) {
 try {
  assertSameOrigin(request);
  const user = await requireUser();
  const length = Number(request.headers.get('content-length') || '0');
  if (length > 2_600_000) throw new AppError('Image must be smaller than 2 MB.', 413);
  const bytes = await boundedBody(request, 2_600_000);
  const data = await new Response(bytes.buffer as ArrayBuffer, { headers: { 'Content-Type': request.headers.get('content-type') ?? '' } }).formData();
  const file = data.get('file');
  if (!(file instanceof File)) throw new AppError('Choose an image to upload.');
  if (file.size > 2 * 1024 * 1024 || file.size < 100) throw new AppError('Image must be between 100 bytes and 2 MB.');
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = detectedImageType(buffer);
  if (!contentType) throw new AppError('Only JPEG, PNG, and WebP images are allowed.');
  const image = await ImageAsset.create({ ownerId: user._id, contentType, data: buffer });
  return NextResponse.json({ url: `/api/images/${image._id}` }, { status: 201 });
 } catch (error) { return apiError(error); }
}
