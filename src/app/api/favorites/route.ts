import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { assertSameOrigin, jsonBody } from '@/lib/security';
import { apiError, AppError } from '@/lib/errors';
import { productDto } from '@/lib/serialize';
import Product from '@/models/Product';
import User from '@/models/User';
const inputSchema=z.object({productId:z.string().regex(/^[a-f0-9]{24}$/i)});
export async function GET() {
 try {
  const user=await requireUser();
  const items=await Product.find({_id:{$in:user.favoriteIds},status:'available'}).sort({createdAt:-1}).lean();
  return NextResponse.json({ids:user.favoriteIds.map(String),items:items.map(item=>productDto(item))});
 }catch(error){return apiError(error);}
}
export async function POST(request:NextRequest) {
 try {
  assertSameOrigin(request);const user=await requireUser();const {productId}=inputSchema.parse(await jsonBody(request));
  if(!await Product.exists({_id:productId,status:'available'}))throw new AppError('This listing is no longer available.',404);
  if(user.favoriteIds.some(id=>String(id)===productId))return NextResponse.json({saved:true});
  const result=await User.updateOne({_id:user._id,'favoriteIds.199':{$exists:false}},{$addToSet:{favoriteIds:productId}});
  if(!result.matchedCount)throw new AppError('You can save up to 200 items. Remove one to save another.',409);
  return NextResponse.json({saved:true});
 }catch(error){return apiError(error);}
}
export async function DELETE(request:NextRequest) {
 try {
  assertSameOrigin(request);const user=await requireUser();const {productId}=inputSchema.parse(await jsonBody(request));
  await User.updateOne({_id:user._id},{$pull:{favoriteIds:productId}});
  return NextResponse.json({saved:false});
 }catch(error){return apiError(error);}
}
