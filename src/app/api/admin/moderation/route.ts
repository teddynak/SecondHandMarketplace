import {userRateLimit} from '@/lib/rate-limit';
import {NextRequest,NextResponse} from 'next/server';
import mongoose from 'mongoose';
import {requireAdmin} from '@/lib/auth';
import {assertSameOrigin,jsonBody} from '@/lib/security';
import {apiError,AppError} from '@/lib/errors';
import {moderationSchema} from '@/lib/moderation-validation';
import Notification from '@/models/Notification';
import {notify} from '@/lib/notifications';
import User from '@/models/User';
import Product from '@/models/Product';
import AuditEvent from '@/models/AuditEvent';
import EntityReport from '@/models/EntityReport';
export const runtime='nodejs';
export async function GET(request:NextRequest){try{
 await requireAdmin();const tab=request.nextUrl.searchParams.get('tab')||'reports';const q=(request.nextUrl.searchParams.get('q')||'').trim().slice(0,80).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const page=Math.max(1,Math.min(1000,parseInt(request.nextUrl.searchParams.get('page')||'1')||1));const skip=(page-1)*20;
 if(tab==='users'){const filter=q?{$or:[{name:{$regex:q,$options:'i'}},{email:{$regex:q,$options:'i'}}]}:{};const [rows,total]=await Promise.all([User.find(filter).select('name email role accountStatus suspensionReason createdAt').sort({_id:-1}).skip(skip).limit(20).lean(),User.countDocuments(filter)]);return NextResponse.json({rows:rows.map(u=>({id:String(u._id),title:u.name,detail:u.email,status:u.accountStatus??'active',role:u.role,reason:u.suspensionReason??''})),page,pages:Math.max(1,Math.ceil(total/20))});}
 if(tab==='listings'){const filter=q?{title:{$regex:q,$options:'i'}}:{};const [rows,total]=await Promise.all([Product.find(filter).select('title sellerName status moderationHidden moderationReason sellerSuspended').sort({_id:-1}).skip(skip).limit(20).lean(),Product.countDocuments(filter)]);return NextResponse.json({rows:rows.map(p=>({id:String(p._id),title:p.title,detail:p.sellerName,status:p.status,hidden:!!p.moderationHidden,sellerSuspended:!!p.sellerSuspended,reason:p.moderationReason??''})),page,pages:Math.max(1,Math.ceil(total/20))});}
 if(tab==='audit'){const [rows,total]=await Promise.all([AuditEvent.find().sort({createdAt:-1,_id:-1}).skip(skip).limit(20).lean(),AuditEvent.countDocuments()]);return NextResponse.json({rows:rows.map(r=>({id:String(r._id),title:r.action,detail:`Actor ${r.actorId} · Target ${r.targetId}`,status:`${r.before||'—'} → ${r.after||'—'}`,reason:r.reason,createdAt:r.createdAt.toISOString()})),page,pages:Math.max(1,Math.ceil(total/20))});}
 if(tab!=='reports')throw new AppError('Unknown administration section.');
 const [rows,total]=await Promise.all([EntityReport.find().sort({createdAt:-1,_id:-1}).skip(skip).limit(20).lean(),EntityReport.countDocuments()]);return NextResponse.json({rows:rows.map(r=>({id:String(r._id),title:`${r.kind==='listing'?'Listing':'Member'} report`,detail:`Target ${r.targetId} · Reporter ${r.reporterId}`,targetId:String(r.targetId),kind:r.kind,status:r.status,reason:r.reason,adminNote:r.adminNote})),page,pages:Math.max(1,Math.ceil(total/20))});
}catch(error){return apiError(error);}}
export async function PATCH(request:NextRequest){try{
 assertSameOrigin(request);const admin=await requireAdmin();await userRateLimit(String(admin._id),'moderation',60);const input=moderationSchema.parse(await jsonBody(request));await AuditEvent.init();await Notification.init();
 await mongoose.connection.transaction(async session=>{let before='',after='',recipient='',href='/dashboard';
  if(input.action==='suspend'||input.action==='restore-account'){
   const user=await User.findById(input.targetId).session(session);if(!user)throw new AppError('Member not found.',404);if(user.role==='admin'||String(user._id)===String(admin._id))throw new AppError('Administrator accounts cannot be suspended here.',403);
   recipient=String(user._id);before=user.accountStatus||'active';after=input.action==='suspend'?'suspended':'active';if(before===after)throw new AppError('This account is already in that state.',409);
   user.accountStatus=after as 'active'|'suspended';user.suspensionReason=input.reason;await user.save({session});await Product.updateMany({sellerId:user._id},{$set:{sellerSuspended:after==='suspended'}},{session});
  }else if(input.action==='hide-listing'||input.action==='restore-listing'){
   const listing=await Product.findById(input.targetId).session(session);if(!listing)throw new AppError('Listing not found.',404);before=listing.moderationHidden?'hidden':'visible';after=input.action==='hide-listing'?'hidden':'visible';if(before===after)throw new AppError('This listing is already in that state.',409);
   recipient=String(listing.sellerId);listing.moderationHidden=after==='hidden';listing.moderationReason=input.reason;await listing.save({session});
  }else{
   const report=await EntityReport.findOneAndUpdate({_id:input.targetId,status:'pending'},{$set:{status:'reviewed',adminNote:input.reason,reviewedBy:admin._id,reviewedAt:new Date()}},{session,returnDocument:'after'});if(!report)throw new AppError('Report not found or already reviewed.',409);recipient=String(report.reporterId);before='pending';after='reviewed';href='/notifications';
  }
  const [event]=await AuditEvent.create([{actorId:admin._id,action:input.action,targetId:input.targetId,reason:input.reason,before,after}],{session});
  await notify(recipient,`moderation:${event._id}`,input.action.replaceAll('-',' '),input.reason,href,'moderation',session);
 });return NextResponse.json({ok:true});
}catch(error){return apiError(error);}}
