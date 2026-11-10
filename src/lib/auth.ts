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
export function publicUser(user: { _id: unknown; name: string; email: string; phone: string; location: string; role: 'buyer'|'seller'|'admin'; createdAt: Date;emailVerifiedAt?:Date|null;accountStatus?:'active'|'suspended';suspensionReason?:string }): PublicUser {
 return { emailVerified:!!user.emailVerifiedAt,accountStatus:user.accountStatus??'active',suspensionReason:user.suspensionReason??'',id: String(user._id), name: user.name, email: user.email, phone: user.phone, location: user.location, role: user.role, createdAt: user.createdAt.toISOString() };
}
export async function signIn(response: NextResponse, userId: string) {
 const member=await User.findById(userId).select('sessionVersion');
 if(!member)throw new AppError('Account not found.',401);
 const token = await new SignJWT({version:member.sessionVersion??0}).setProtectedHeader({ alg: 'HS256' }).setSubject(userId)
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
 let subject: string;let version=0;
 try {
  const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
  if (!payload.sub || !/^[a-f\d]{24}$/i.test(payload.sub)) return null;
  subject = payload.sub;
  if(payload.version!==undefined&&(!Number.isSafeInteger(payload.version)||Number(payload.version)<0))return null;
  version=Number(payload.version??0);
 } catch (error) {
  if (error instanceof AppError) throw error;
  return null;
 }
 await connectDb();
 const member=await User.findById(subject);
 return member&&(member.sessionVersion??0)===version?member:null;
}
export async function requireUser() {
 const user = await currentUser();
 if (!user) throw new AppError('Please log in to continue.', 401);
 if(user.accountStatus==='suspended')throw new AppError(`Your account is suspended. Reason: ${user.suspensionReason||'Please contact the administrator.'}`,403);
 return user;
}
export async function requireAdmin() {
 const user = await requireUser();
 if (user.role !== 'admin') throw new AppError('Administrator access is required.', 403);
 return user;
}
