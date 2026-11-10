import {NextRequest,NextResponse} from 'next/server';
import {requireUser} from '@/lib/auth';
import {assertSameOrigin,jsonBody} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {reportConversationSchema} from '@/lib/messaging-validation';
import {participantConversation,otherParticipant} from '@/lib/messaging';
import {userRateLimit} from '@/lib/rate-limit';
import Report from '@/models/Report';
import Message from '@/models/Message';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const user=await requireUser();const {conversationId,reason}=reportConversationSchema.parse(await jsonBody(request));
 const conversation=await participantConversation(conversationId,String(user._id));
 if(await Report.exists({reporterId:user._id,conversationId,status:'pending'}))throw new AppError('You already have a report awaiting review for this conversation.',409);
 await userRateLimit(String(user._id),'report-conversation',5,3600);await Report.init();
 const evidence=(await Message.find({conversationId}).sort({sequence:-1}).limit(20).lean()).reverse().map(m=>({senderId:String(m.senderId),text:m.text,createdAt:m.createdAt}));
 const report=await Report.create({reporterId:user._id,reportedUserId:otherParticipant(conversation,String(user._id)),conversationId,reason,evidence});
 return NextResponse.json({id:String(report._id),status:report.status},{status:201});
}catch(error){return apiError(error);}}
