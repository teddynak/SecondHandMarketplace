import {NextRequest,NextResponse} from 'next/server';
import mongoose from 'mongoose';
import {requireUser} from '@/lib/auth';
import {assertSameOrigin,jsonBody} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {messageDto,otherParticipant,participantConversation} from '@/lib/messaging';
import {sendMessageSchema} from '@/lib/messaging-validation';
import {userRateLimit} from '@/lib/rate-limit';
import Notification from '@/models/Notification';
import {notify} from '@/lib/notifications';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Product from '@/models/Product';
import User from '@/models/User';
import UserBlock from '@/models/UserBlock';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export async function POST(request:NextRequest,{params}:Context){try{
 assertSameOrigin(request);const user=await requireUser();const userId=String(user._id);const {id}=await params;
 const conversation=await participantConversation(id,userId);const input=sendMessageSchema.parse(await jsonBody(request));
 // Stable client IDs make retrying an ambiguous network failure safe.
 const existing=await Message.findOne({conversationId:id,clientId:input.clientId});
 if(existing){if(String(existing.senderId)!==userId||existing.text!==input.text)throw new AppError('Message identifier is already in use.',409);return NextResponse.json({message:messageDto(existing)});}
 await userRateLimit(userId,'send-message',30);await Message.init();await Notification.init();
 const otherId=otherParticipant(conversation,userId);
 const sent=await mongoose.connection.transaction(async session=>{
  const listing=await Product.findOne({_id:conversation.listingId,status:'available',condition:{$ne:'New'},moderationHidden:{$ne:true},sellerSuspended:{$ne:true}}).session(session);
  if(!listing)throw new AppError('This listing is no longer available. You can still read the conversation.',409);
  if(!await User.exists({_id:otherId,accountStatus:{$ne:'suspended'}}).session(session))throw new AppError('This member is no longer available.',409);
  if(await UserBlock.exists({$or:[{blockerId:userId,blockedId:otherId},{blockerId:otherId,blockedId:userId}]}).session(session))throw new AppError('Messages are unavailable while a block is in place.',403);
  const updated=await Conversation.findByIdAndUpdate(id,{$inc:{sequence:1},$set:{lastMessage:input.text.slice(0,160),lastActivityAt:new Date()}},{new:true,session});
  if(!updated)throw new AppError('Conversation not found.',404);
  const [message]=await Message.create([{conversationId:conversation._id,senderId:user._id,recipientId:otherId,text:input.text,clientId:input.clientId,sequence:updated.sequence}],{session});
  await notify(otherId,`message:${message._id}`,'New message on ReUse',input.text,`/inbox/${id}`,'message',session);
  return message;
 });
 return NextResponse.json({message:messageDto(sent)},{status:201});
}catch(error){return apiError(error);}}
