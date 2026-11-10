import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/auth';
import {assertSameOrigin,jsonBody,validObjectId} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {reviewReportSchema} from '@/lib/messaging-validation';
import mongoose from 'mongoose';
import Notification from '@/models/Notification';
import {notify} from '@/lib/notifications';
import AuditEvent from '@/models/AuditEvent';
import Report from '@/models/Report';
export const runtime='nodejs';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 assertSameOrigin(request);const admin=await requireAdmin();const {id}=await params;if(!validObjectId(id))throw new AppError('Report not found.',404);
 const {adminNote}=reviewReportSchema.parse(await jsonBody(request));
 await AuditEvent.init();await Notification.init();
 await mongoose.connection.transaction(async session=>{
  const report=await Report.findOneAndUpdate({_id:id,status:'pending'},{$set:{status:'reviewed',adminNote,reviewedBy:admin._id,reviewedAt:new Date()}},{returnDocument:'after',session});
  if(!report)throw new AppError('Report not found or already reviewed.',409);
  const [event]=await AuditEvent.create([{actorId:admin._id,action:'review-conversation-report',targetId:id,reason:adminNote,before:'pending',after:'reviewed'}],{session});
  await notify(String(report.reporterId),`moderation:${event._id}`,'Conversation report reviewed',adminNote,'/notifications','moderation',session);
 });
 return NextResponse.json({ok:true});
}catch(error){return apiError(error);}}
