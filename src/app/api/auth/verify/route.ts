import {NextRequest,NextResponse} from 'next/server';
import mongoose from 'mongoose';
import {z} from 'zod';
import {connectDb} from '@/lib/db';
import {assertSameOrigin,jsonBody} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {tokenSchema} from '@/lib/account-validation';
import {hashToken} from '@/lib/account-tokens';
import {requestRateLimit} from '@/lib/rate-limit';
import User from '@/models/User';
import AccountToken from '@/models/AccountToken';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await connectDb();await requestRateLimit(request,'verify-token-ip',20,3600);const {token}=z.object({token:tokenSchema}).parse(await jsonBody(request));
 await mongoose.connection.transaction(async session=>{
  const record=await AccountToken.findOne({hash:hashToken(token),purpose:'verify',usedAt:null,expiresAt:{$gt:new Date()}}).session(session);if(!record)throw new AppError('This verification link is invalid, expired or already used. Request a new one.');
  const result=await User.updateOne({_id:record.userId,email:record.email,accountStatus:{$ne:'suspended'}},{$set:{emailVerifiedAt:new Date()}},{session});if(!result.matchedCount)throw new AppError('This verification link cannot be used.');
  await AccountToken.updateMany({userId:record.userId,purpose:'verify',usedAt:null},{$set:{usedAt:new Date()}},{session});
 });return NextResponse.json({message:'Your email address is verified. This confirms access to your email, not your identity or seller reliability.'});
}catch(error){return apiError(error);}}
