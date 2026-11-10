import {Types} from 'mongoose';
import Conversation,{type IConversation} from '@/models/Conversation';
import Message,{type IMessage} from '@/models/Message';
import Product from '@/models/Product';
import User from '@/models/User';
import UserBlock from '@/models/UserBlock';
import {AppError} from './errors';
import {validObjectId} from './security';
export async function participantConversation(id:string,userId:string){
 if(!validObjectId(id))throw new AppError('Conversation not found.',404);
 const conversation=await Conversation.findOne({_id:id,$or:[{buyerId:userId},{sellerId:userId}]});
 if(!conversation)throw new AppError('Conversation not found.',404);
 return conversation;
}
export function otherParticipant(conversation:IConversation,userId:string){return String(conversation.buyerId)===userId?String(conversation.sellerId):String(conversation.buyerId);}
export async function blockState(userId:string,otherId:string){
 const blocks=await UserBlock.find({$or:[{blockerId:userId,blockedId:otherId},{blockerId:otherId,blockedId:userId}]}).lean();
 return {blockedByMe:blocks.some(b=>String(b.blockerId)===userId),blocked:blocks.length>0};
}
export function messageDto(message:IMessage&{_id:unknown}){return {id:String(message._id),senderId:String(message.senderId),text:message.text,sequence:message.sequence,clientId:message.clientId,createdAt:message.createdAt.toISOString()};}
export async function conversationDto(conversation:IConversation&{_id:unknown},userId:string){
 const otherId=otherParticipant(conversation,userId);
 const [person,listing,blocks,unread]=await Promise.all([User.findById(otherId).select('name accountStatus').lean(),Product.findById(conversation.listingId).select('title status condition moderationHidden sellerSuspended').lean(),blockState(userId,otherId),Message.countDocuments({conversationId:String(conversation._id),recipientId:userId,readAt:null})]);
 const listingStatus=listing?.status??'missing';
 const unavailable=listingStatus!=='available'||listing?.condition==='New'||listing?.moderationHidden||listing?.sellerSuspended||person?.accountStatus==='suspended';
 return {id:String(conversation._id),listingId:String(conversation.listingId),listingTitle:listing?.title??conversation.listingTitle,listingStatus,otherId,otherName:person?.name??'Former member',lastMessage:conversation.lastMessage,lastActivityAt:conversation.lastActivityAt.toISOString(),unread,...blocks,canSend:!!person&&!blocks.blocked&&!unavailable,unavailableReason:blocks.blocked?(blocks.blockedByMe?'You blocked this member. Unblock them to exchange messages.':'Messages are unavailable because a block is in place.'):!person?'This member is no longer available.':unavailable?(listingStatus==='sold'?'This item is sold. Message history remains available.':listingStatus==='archived'?'This listing was archived. Message history remains available.':'This listing is no longer available. Message history remains available.'):'',sequence:conversation.sequence};
}
export const participantFilter=(userId:Types.ObjectId)=>({$or:[{buyerId:userId},{sellerId:userId}]});
