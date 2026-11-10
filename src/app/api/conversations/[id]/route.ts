import {NextRequest,NextResponse} from 'next/server';
import {requireUser} from '@/lib/auth';
import {assertSameOrigin,jsonBody} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {conversationDto,messageDto,participantConversation} from '@/lib/messaging';
import {readMessagesSchema} from '@/lib/messaging-validation';
import Message from '@/models/Message';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function GET(request:NextRequest,{params}:Context){try{
 const user=await requireUser();const {id}=await params;const conversation=await participantConversation(id,String(user._id));
 const before=request.nextUrl.searchParams.get('before');const after=request.nextUrl.searchParams.get('after');
 if(before&&after)throw new AppError('Choose older or newer messages, not both.');
 const cursor=Number(before??after??0);if(!Number.isSafeInteger(cursor)||cursor<0)throw new AppError('Invalid message cursor.');
 const filter={conversationId:conversation._id,...(before?{sequence:{$lt:cursor}}:after?{sequence:{$gt:cursor}}:{})};
 const results=await Message.find(filter).sort({sequence:after?1:-1}).limit(41).lean();const hasMore=results.length>40;const messages=results.slice(0,40);if(!after)messages.reverse();
 return NextResponse.json({conversation:await conversationDto(conversation,String(user._id)),messages:messages.map(messageDto),hasMore});
}catch(error){return apiError(error);}}
export async function PATCH(request:NextRequest,{params}:Context){try{
 assertSameOrigin(request);const user=await requireUser();const {id}=await params;const conversation=await participantConversation(id,String(user._id));
 const {through}=readMessagesSchema.parse(await jsonBody(request));
 await Message.updateMany({conversationId:conversation._id,recipientId:user._id,readAt:null,sequence:{$lte:Math.min(through,conversation.sequence)}},{$set:{readAt:new Date()}});
 return NextResponse.json({ok:true});
}catch(error){return apiError(error);}}
