import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/lib/auth';
import { assertSameOrigin } from '@/lib/security';
import { apiError } from '@/lib/errors';
export async function POST(request: NextRequest) {
 try { assertSameOrigin(request); return signOut(NextResponse.json({ ok: true })); }
 catch (error) { return apiError(error); }
}
