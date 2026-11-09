import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { PublicUser } from '@/types';
import { AppError } from './errors';
import { connectDb } from './db';
import User from '@/models/User';

const COOKIE_NAME = 'reuse_market_session';
const WEEK = 60 * 60 * 24 * 7;
function secret() {
 const value = process.env.AUTH_SECRET;
 if (!value || value.length < 32 || value.startsWith('REPLACE_WITH')) throw new AppError('Authentication is not configured. Set AUTH_SECRET in .env.local.', 503);
 return new TextEncoder().encode(value);
}
export function publicUser(user: { _id: unknown; name: string; email: string; phone: string; location: string; role: 'buyer'|'seller'|'admin'; createdAt: Date }): PublicUser {
 return { id: String(user._id), name: user.name, email: user.email, phone: user.phone, location: user.location, role: user.role, createdAt: user.createdAt.toISOString() };
}
export async function signIn(response: NextResponse, userId: string) {
 const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(userId)
  .setIssuedAt().setExpirationTime('7d').sign(secret());
 response.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: WEEK });
 return response;
}
export function signOut(response: NextResponse) {
 response.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
 return response;
}
export async function currentUser() {
 const token = (await cookies()).get(COOKIE_NAME)?.value;
 if (!token) return null;
 let subject: string;
 try {
  const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
  if (!payload.sub || !/^[a-f\d]{24}$/i.test(payload.sub)) return null;
  subject = payload.sub;
 } catch (error) {
  if (error instanceof AppError) throw error;
  return null;
 }
 await connectDb();
 return await User.findById(subject);
}
export async function requireUser() {
 const user = await currentUser();
 if (!user) throw new AppError('Please log in to continue.', 401);
 return user;
}
export async function requireAdmin() {
 const user = await requireUser();
 if (user.role !== 'admin') throw new AppError('Administrator access is required.', 403);
 return user;
}
