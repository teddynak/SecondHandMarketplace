import {NextRequest,NextResponse} from 'next/server';
import {requireUser} from '@/lib/auth';
import {assertSameOrigin,jsonBody} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {startConversationSchema} from '@/lib/messaging-validation';
import {blockState,conversationDto,participantFilter} from '@/lib/messaging';
import {userRateLimit} from '@/lib/rate-limit';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Product from '@/models/Product';
import User from '@/models/User';
export const runtime='nodejs';
export async function GET(request:NextRequest){try{
 const user=await requireUser();const userId=String(user._id);
 const page=Math.max(1,Math.min(1000,parseInt(request.nextUrl.searchParams.get('page')||'1')||1));
 const filter=participantFilter(user._id);const total=await Conversation.countDocuments(filter);const pages=Math.max(1,Math.ceil(total/20));const actualPage=Math.min(page,pages);
 const [conversations,unreadTotal]=await Promise.all([Conversation.find(filter).sort({lastActivityAt:-1,_id:-1}).skip((actualPage-1)*20).limit(20).lean(),Message.countDocuments({recipientId:user._id,readAt:null})]);
 return NextResponse.json({conversations:await Promise.all(conversations.map(c=>conversationDto(c,userId))),unreadTotal,page:actualPage,pages});
}catch(error){return apiError(error);}}
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const user=await requireUser();const userId=String(user._id);
 const {listingId}=startConversationSchema.parse(await jsonBody(request));
 const listing=await Product.findOne({_id:listingId,status:'available',condition:{$ne:'New'},moderationHidden:{$ne:true},sellerSuspended:{$ne:true}});
 if(!listing)throw new AppError('This listing is no longer available for a new conversation.',404);
 if(String(listing.sellerId)===userId)throw new AppError('You cannot contact yourself about your own listing. View your inbox for buyer messages.',400);
 if(!await User.exists({_id:listing.sellerId,accountStatus:{$ne:'suspended'}}))throw new AppError('This seller is no longer available.',404);
 if((await blockState(userId,String(listing.sellerId))).blocked)throw new AppError('You cannot start a conversation while a block is in place.',403);
 await userRateLimit(userId,'start-conversation',10);
 await Conversation.init();
 const conversation=await Conversation.findOneAndUpdate({listingId:listing._id,buyerId:user._id,sellerId:listing.sellerId},{$setOnInsert:{listingTitle:listing.title,lastActivityAt:new Date()}},{upsert:true,returnDocument:'after'});
 return NextResponse.json({conversation:await conversationDto(conversation,userId)});
}catch(error){return apiError(error);}}
