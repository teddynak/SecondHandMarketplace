import {NextRequest,NextResponse} from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {connectDb} from '@/lib/db';
import {signOut} from '@/lib/auth';
import {assertSameOrigin,jsonBody} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {resetPasswordSchema} from '@/lib/account-validation';
import {hashToken} from '@/lib/account-tokens';
import {requestRateLimit} from '@/lib/rate-limit';
import AccountToken from '@/models/AccountToken';
import User from '@/models/User';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await connectDb();await requestRateLimit(request,'reset-ip',20,3600);const input=resetPasswordSchema.parse(await jsonBody(request));const passwordHash=await bcrypt.hash(input.newPassword,12);
 await mongoose.connection.transaction(async session=>{
  const token=await AccountToken.findOne({hash:hashToken(input.token),purpose:'reset',usedAt:null,expiresAt:{$gt:new Date()}}).session(session);if(!token)throw new AppError('This reset link is invalid, expired or already used. Request a new one.');
  const user=await User.findOneAndUpdate({_id:token.userId,email:token.email,accountStatus:{$ne:'suspended'}},{$set:{passwordHash},$inc:{sessionVersion:1}},{session,returnDocument:'after'});if(!user)throw new AppError('This reset link cannot be used. Request help from the site administrator.');
  await AccountToken.updateMany({userId:user._id,purpose:'reset',usedAt:null},{$set:{usedAt:new Date()}},{session});
 });return signOut(NextResponse.json({message:'Your password has been reset. Log in with your new password. All previous sessions have been signed out.'}));
}catch(error){return apiError(error);}}
