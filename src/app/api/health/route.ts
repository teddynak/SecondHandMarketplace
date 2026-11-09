import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
export const runtime = 'nodejs';
export async function GET() {
 try { await connectDb(); return NextResponse.json({ status: 'ok', database: 'connected' }); }
 catch { return NextResponse.json({ status: 'degraded', database: 'unavailable' }, { status: 503 }); }
}
