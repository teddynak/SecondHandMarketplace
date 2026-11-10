import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {currentUser} from '@/lib/auth';
import {assertSameOrigin,jsonBody} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {objectId} from '@/lib/messaging-validation';
import Notification from '@/models/Notification';
export const runtime='nodejs';
export async function GET(request:NextRequest){try{
 const user=await currentUser();if(!user)throw new AppError('Please log in to view notifications.',401);const page=Math.max(1,Math.min(1000,parseInt(request.nextUrl.searchParams.get('page')||'1')||1));const [rows,total,unread]=await Promise.all([Notification.find({userId:user._id}).sort({createdAt:-1,_id:-1}).skip((page-1)*20).limit(20).lean(),Notification.countDocuments({userId:user._id}),Notification.countDocuments({userId:user._id,readAt:null})]);return NextResponse.json({notifications:rows.map(n=>({id:String(n._id),type:n.type,title:n.title,body:n.body,href:n.href,read:!!n.readAt,createdAt:n.createdAt.toISOString()})),page,pages:Math.max(1,Math.ceil(total/20)),unread});
}catch(error){return apiError(error);}}
export async function PATCH(request:NextRequest){try{
 assertSameOrigin(request);const user=await currentUser();if(!user)throw new AppError('Please log in to view notifications.',401);const {id}=z.object({id:objectId}).parse(await jsonBody(request));const result=await Notification.updateOne({_id:id,userId:user._id},{$set:{readAt:new Date()}});if(!result.matchedCount)throw new AppError('Notification not found.',404);return NextResponse.json({ok:true});
}catch(error){return apiError(error);}}
