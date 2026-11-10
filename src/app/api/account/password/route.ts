import {NextRequest,NextResponse} from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {requireUser,signOut} from '@/lib/auth';
import {assertSameOrigin,jsonBody} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {changePasswordSchema} from '@/lib/account-validation';
import {userRateLimit} from '@/lib/rate-limit';
import User from '@/models/User';
import AccountToken from '@/models/AccountToken';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const current=await requireUser();await userRateLimit(String(current._id),'password-change',5,3600);const input=changePasswordSchema.parse(await jsonBody(request));
 const user=await User.findById(current._id).select('+passwordHash');if(!user||!await bcrypt.compare(input.currentPassword,user.passwordHash))throw new AppError('Your current password is incorrect.',400);
 const passwordHash=await bcrypt.hash(input.newPassword,12);await AccountToken.init();
 await mongoose.connection.transaction(async session=>{
  const updated=await User.updateOne({_id:user._id,passwordHash:user.passwordHash,accountStatus:{$ne:'suspended'}},{$set:{passwordHash},$inc:{sessionVersion:1}},{session});if(!updated.matchedCount)throw new AppError('Your account changed. Log in again and retry.',409);
  await AccountToken.updateMany({userId:user._id,purpose:'reset',usedAt:null},{$set:{usedAt:new Date()}},{session});
 });return signOut(NextResponse.json({message:'Password changed. Please log in again. All previous sessions have been signed out.'}));
}catch(error){return apiError(error);}}
