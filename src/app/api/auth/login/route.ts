import { NextRequest, NextResponse } from 'next/server';
import {createHash} from 'node:crypto';
import {requestRateLimit,userRateLimit} from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';
import { connectDb } from '@/lib/db';
import { apiError, AppError } from '@/lib/errors';
import { assertSameOrigin, jsonBody } from '@/lib/security';
import { loginSchema } from '@/lib/validators';
import { publicUser, signIn } from '@/lib/auth';
import User from '@/models/User';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
 try {
  assertSameOrigin(request);
  const { email, password } = loginSchema.parse(await jsonBody(request));
  await connectDb();
  await requestRateLimit(request,'login-ip',100,900);
  await userRateLimit(createHash('sha256').update(email).digest('hex'),'login-account',10,900);
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError('Invalid email or password.', 401);
  if(user.accountStatus==='suspended')throw new AppError(`Your account is suspended. Reason: ${user.suspensionReason}`,403);
  return await signIn(NextResponse.json({ user: publicUser(user) }), String(user._id));
 } catch (error) { return apiError(error); }
}
