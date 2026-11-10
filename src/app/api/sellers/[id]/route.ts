import { NextRequest, NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import { apiError, AppError } from '@/lib/errors';
import { validObjectId } from '@/lib/security';
import { productDto } from '@/lib/serialize';
import User from '@/models/User';
import Product from '@/models/Product';
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{const {id}=await params;if(!validObjectId(id))throw new AppError('Seller not found.',404);await connectDb();
 const user=await User.findById(id).select('name location createdAt accountStatus').lean();if(!user||user.accountStatus==='suspended')throw new AppError('Seller not found.',404);
 const items=await Product.find({sellerId:id,status:'available',condition:{$ne:'New'},moderationHidden:{$ne:true},sellerSuspended:{$ne:true}}).sort({createdAt:-1}).lean();
 return NextResponse.json({seller:{id:String(user._id),name:user.name,location:user.location,createdAt:user.createdAt.toISOString()},items:items.map(item=>productDto(item))});
 }catch(error){return apiError(error);}
}
