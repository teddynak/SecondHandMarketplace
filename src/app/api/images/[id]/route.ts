import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import { validObjectId } from '@/lib/security';
import ImageAsset from '@/models/ImageAsset';
export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: RouteContext) {
 const { id } = await params;
 if (!validObjectId(id)) return new NextResponse('Not found', { status: 404 });
 try {
  await connectDb();
  const image = await ImageAsset.findById(id);
  if (!image) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(new Uint8Array(image.data), { headers: { 'Content-Type': image.contentType, 'Content-Disposition': 'inline', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=31536000, immutable' } });
 } catch { return new NextResponse('Image unavailable', { status: 503 }); }
}
