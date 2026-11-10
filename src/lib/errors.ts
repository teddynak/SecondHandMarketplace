import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
export class AppError extends Error { constructor(message: string, public status = 400,public retryAfter=0) { super(message); } }
export function apiError(error: unknown): NextResponse {
 if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.status,headers:error.retryAfter?{'Retry-After':String(error.retryAfter)}:undefined });
 if (error instanceof Error && error.message.includes('Transaction numbers are only allowed')) return NextResponse.json({ error: 'This action requires MongoDB Atlas or a replica set. See README setup.' }, { status: 503 });
 if (error instanceof Error && error.name === 'VersionError') return NextResponse.json({ error: 'This record changed. Refresh and try again.' }, { status: 409 });
 if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
 if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) return NextResponse.json({ error: 'This record already exists.' }, { status: 409 });
 console.error('[API] Unexpected error:', error);
 return NextResponse.json({ error: 'An unexpected server error occurred. Please try again.' }, { status: 500 });
}
