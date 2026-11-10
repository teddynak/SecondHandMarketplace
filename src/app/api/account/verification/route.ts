import {NextRequest,NextResponse} from 'next/server';
import {requireUser} from '@/lib/auth';
import {assertSameOrigin} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {issueAccountToken} from '@/lib/account-tokens';
import {userRateLimit} from '@/lib/rate-limit';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const user=await requireUser();if(user.emailVerifiedAt)throw new AppError('Your email is already verified.',409);await userRateLimit(String(user._id),'verify-email',3,3600);await issueAccountToken(String(user._id),user.email,'verify');
 return NextResponse.json({message:'The email provider accepted the verification request. Check your inbox and spam folder. Delivery is not guaranteed.'});
}catch(error){return apiError(error);}}
