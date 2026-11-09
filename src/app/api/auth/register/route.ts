import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDb } from '@/lib/db';
import { apiError, AppError } from '@/lib/errors';
import { assertSameOrigin, jsonBody } from '@/lib/security';
import { registerSchema } from '@/lib/validators';
import { publicUser, signIn } from '@/lib/auth';
import User from '@/models/User';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
 try {
  assertSameOrigin(request);
  const details = registerSchema.parse(await jsonBody(request));
  await connectDb();
  if (await User.exists({ email: details.email })) throw new AppError('An account with this email already exists.', 409);
  const passwordHash = await bcrypt.hash(details.password, 12);
  const user = await User.create({ name: details.name, email: details.email, passwordHash, phone: details.phone, location: details.location, role: 'buyer' });
  try {
   return await signIn(NextResponse.json({ user: publicUser(user) }, { status: 201 }), String(user._id));
  } catch (error) {
   await User.deleteOne({ _id: user._id }); // avoid half-created accounts when auth setup is missing
   throw error;
  }
 } catch (error) { return apiError(error); }
}
