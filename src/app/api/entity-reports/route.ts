import {NextRequest,NextResponse} from 'next/server';
import {requireUser} from '@/lib/auth';
import {assertSameOrigin,jsonBody} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {entityReportSchema} from '@/lib/moderation-validation';
import {userRateLimit} from '@/lib/rate-limit';
import EntityReport from '@/models/EntityReport';
import Product from '@/models/Product';
import User from '@/models/User';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const user=await requireUser();const input=entityReportSchema.parse(await jsonBody(request));
 if(input.kind==='user'){if(input.targetId===String(user._id))throw new AppError('You cannot report yourself.');if(!await User.exists({_id:input.targetId,accountStatus:{$ne:'suspended'}}))throw new AppError('Member not found.',404);}
 else{const item=await Product.findOne({_id:input.targetId,status:'available',condition:{$ne:'New'},moderationHidden:{$ne:true},sellerSuspended:{$ne:true}});if(!item)throw new AppError('Listing not found.',404);if(String(item.sellerId)===String(user._id))throw new AppError('Use Request removal to manage your own listing.');}
 await userRateLimit(String(user._id),'entity-report',5,3600);await EntityReport.init();
 if(await EntityReport.exists({reporterId:user._id,kind:input.kind,targetId:input.targetId,status:'pending'}))throw new AppError('Your report for this item or member is already awaiting review.',409);
 const report=await EntityReport.create({...input,reporterId:user._id});return NextResponse.json({id:String(report._id),status:'pending'},{status:201});
}catch(error){return apiError(error);}}
