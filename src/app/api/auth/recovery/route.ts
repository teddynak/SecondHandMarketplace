import {NextRequest,NextResponse} from 'next/server';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {connectDb} from '@/lib/db';
import {assertSameOrigin,jsonBody} from '@/lib/security';
import {apiError} from '@/lib/errors';
import {emailSchema} from '@/lib/account-validation';
import {emailConfiguration} from '@/lib/email';
import {issueAccountToken} from '@/lib/account-tokens';
import {requestRateLimit,userRateLimit} from '@/lib/rate-limit';
import User from '@/models/User';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await connectDb();await requestRateLimit(request,'recovery-ip',20,3600);const {email}=z.object({email:emailSchema}).parse(await jsonBody(request));emailConfiguration();
 await userRateLimit(createHash('sha256').update(email).digest('hex'),'recovery-email',5,3600);
 const user=await User.findOne({email,accountStatus:{$ne:'suspended'}});
 if(user){try{await issueAccountToken(String(user._id),user.email,'reset');}catch{console.error('[Account recovery] Email provider did not confirm acceptance.');}}
 return NextResponse.json({message:'For privacy, this response does not confirm an account or email delivery. If an eligible account exists and the provider accepts the request, a reset link may arrive. Check your inbox and spam folder; otherwise contact the site operator.'});
}catch(error){return apiError(error);}}
