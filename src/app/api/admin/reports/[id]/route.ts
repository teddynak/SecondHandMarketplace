import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/auth';
import {assertSameOrigin,jsonBody,validObjectId} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {reviewReportSchema} from '@/lib/messaging-validation';
import Report from '@/models/Report';
export const runtime='nodejs';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 assertSameOrigin(request);const admin=await requireAdmin();const {id}=await params;if(!validObjectId(id))throw new AppError('Report not found.',404);
 const {adminNote}=reviewReportSchema.parse(await jsonBody(request));
 const report=await Report.findOneAndUpdate({_id:id,status:'pending'},{$set:{status:'reviewed',adminNote,reviewedBy:admin._id,reviewedAt:new Date()}},{new:true});
 if(!report)throw new AppError('Report not found or already reviewed.',409);
 return NextResponse.json({ok:true});
}catch(error){return apiError(error);}}
