import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {requireUser} from '@/lib/auth';
import {assertSameOrigin,jsonBody} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {objectId} from '@/lib/messaging-validation';
import UserBlock from '@/models/UserBlock';
import User from '@/models/User';
import Conversation from '@/models/Conversation';
export const runtime='nodejs';
export async function GET(){try{const user=await requireUser();const blocks=await UserBlock.find({blockerId:user._id}).sort({createdAt:-1}).limit(200).lean();const people=await User.find({_id:{$in:blocks.map(b=>b.blockedId)}}).select('name').lean();const names=new Map(people.map(p=>[String(p._id),p.name]));return NextResponse.json({blocks:blocks.map(b=>({userId:String(b.blockedId),name:names.get(String(b.blockedId))??'Former member'}))});}catch(error){return apiError(error);}}
async function mutate(request:NextRequest,remove:boolean){try{
 assertSameOrigin(request);const user=await requireUser();const {userId}=z.object({userId:objectId}).parse(await jsonBody(request));
 if(userId===String(user._id))throw new AppError('You cannot block yourself.');
 if(remove){await UserBlock.deleteOne({blockerId:user._id,blockedId:userId});}
 else{
  // Limit this endpoint to people with whom the user has a conversation.
  if(!await Conversation.exists({$or:[{buyerId:user._id,sellerId:userId},{sellerId:user._id,buyerId:userId}]}))throw new AppError('Start from an existing conversation to block a member.',404);
  if(await UserBlock.countDocuments({blockerId:user._id})>=200&&!await UserBlock.exists({blockerId:user._id,blockedId:userId}))throw new AppError('Your block list has reached its limit. Contact an administrator for further help.',409);
  await UserBlock.init();await UserBlock.updateOne({blockerId:user._id,blockedId:userId},{$setOnInsert:{blockerId:user._id,blockedId:userId}},{upsert:true});
 }
 return NextResponse.json({ok:true});
}catch(error){return apiError(error);}}
export const POST=(request:NextRequest)=>mutate(request,false);
export const DELETE=(request:NextRequest)=>mutate(request,true);
