import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/auth';
import {apiError} from '@/lib/errors';
import Report from '@/models/Report';
import User from '@/models/User';
export const runtime='nodejs';
export async function GET(request:NextRequest){try{
 await requireAdmin();const page=Math.max(1,Math.min(1000,parseInt(request.nextUrl.searchParams.get('page')||'1')||1));const total=await Report.countDocuments();const pages=Math.max(1,Math.ceil(total/20));const actualPage=Math.min(page,pages);
 const reports=await Report.find().sort({createdAt:-1,_id:-1}).skip((actualPage-1)*20).limit(20).lean();
 const people=await User.find({_id:{$in:reports.flatMap(r=>[r.reporterId,r.reportedUserId])}}).select('name').lean();const names=new Map(people.map(p=>[String(p._id),p.name]));
 return NextResponse.json({page:actualPage,pages,reports:reports.map(r=>({id:String(r._id),reporterName:names.get(String(r.reporterId))??'Former member',reportedName:names.get(String(r.reportedUserId))??'Former member',reason:r.reason,status:r.status,adminNote:r.adminNote,createdAt:r.createdAt.toISOString(),evidence:r.evidence.map(e=>({senderName:names.get(e.senderId)??'Former member',text:e.text,createdAt:e.createdAt.toISOString()}))}))});
}catch(error){return apiError(error);}}
