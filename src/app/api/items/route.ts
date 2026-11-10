import { NextRequest, NextResponse } from 'next/server';
import { isStoredImage } from '@/lib/image-source';
import mongoose,{ Types } from 'mongoose';
import { connectDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { apiError, AppError } from '@/lib/errors';
import { assertSameOrigin, jsonBody } from '@/lib/security';
import { productSchema } from '@/lib/validators';
import { productDto } from '@/lib/serialize';
import { CATEGORIES } from '@/types';
import User from '@/models/User';
import Product from '@/models/Product';
import ImageAsset from '@/models/ImageAsset';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
 try {
  await connectDb();
  const params = request.nextUrl.searchParams;
  const query = (params.get('q') ?? '').trim().slice(0, 100);
  const location = (params.get('location') ?? '').trim().slice(0,80);
  const category = params.get('category') ?? '';
  const rawMin = params.get('minPrice'); const rawMax = params.get('maxPrice');
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.get('page') ?? '1', 10) || 1));
  const limit = Math.max(1, Math.min(24, Number.parseInt(params.get('limit') ?? '12', 10) || 12));
  const sort = params.get('sort') ?? 'newest';
  const filter: Record<string, unknown> = { status: 'available', condition: { $ne: 'New' },moderationHidden:{$ne:true},sellerSuspended:{$ne:true} };
  if (query) {
   const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   filter.$or = [{ title: { $regex: safe, $options: 'i' } }, { description: { $regex: safe, $options: 'i' } }, { location: { $regex: safe, $options: 'i' } }];
  }
  if (location) filter.location = { $regex: location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (CATEGORIES.includes(category as (typeof CATEGORIES)[number])) filter.category = category;
  const price: Record<string, number> = {};
  if (rawMin) { const n = Number(rawMin); if (!Number.isFinite(n) || n < 0) throw new AppError('Invalid minimum price.'); price.$gte = n; }
  if (rawMax) { const n = Number(rawMax); if (!Number.isFinite(n) || n < 0) throw new AppError('Invalid maximum price.'); price.$lte = n; }
  if (price.$gte !== undefined && price.$lte !== undefined && price.$gte > price.$lte) throw new AppError('Minimum price must not exceed maximum price.');
  if (Object.keys(price).length) filter.price = price;
  const sorting: Record<string, 1|-1> = sort === 'price-low' ? { price: 1, _id: 1 } : sort === 'price-high' ? { price: -1, _id: -1 } : { createdAt: -1, _id: -1 };
  const [foundItems, total] = await Promise.all([
   Product.find(filter).sort(sorting).skip((page - 1) * limit).limit(limit).lean(),
   Product.countDocuments(filter)
  ]);
  let items=foundItems;
  const pages=Math.max(1,Math.ceil(total/limit));const resultPage=Math.min(page,pages);
  if(resultPage!==page)items=total?await Product.find(filter).sort(sorting).skip((resultPage-1)*limit).limit(limit).lean():[];
  return NextResponse.json({items:items.map(p=>productDto(p)),total,page:resultPage,pages});
 } catch (error) { return apiError(error); }
}
export async function POST(request: NextRequest) {
 try {
  assertSameOrigin(request);
  const user = await requireUser();
  const body = productSchema.parse(await jsonBody(request));
  if (body.images.length) {
   const ids = body.images.filter(isStoredImage).map(path => new Types.ObjectId(path.split('/').pop()));
   const count = await ImageAsset.countDocuments({ _id: { $in: ids }, ownerId: user._id });
   if (count !== new Set(ids.map(String)).size) throw new AppError('One or more uploaded images do not belong to your account.', 403);
  }
  await Product.init();
  const product=await mongoose.connection.transaction(async session=>{
   const member=await User.findOneAndUpdate({_id:user._id,accountStatus:{$ne:'suspended'}},{$inc:{activityVersion:1}},{new:true,session});
   if(!member)throw new AppError('Your account is suspended.',403);
   const [created]=await Product.create([{...body,sellerId:member._id,sellerName:member.name,sellerEmail:member.email,status:'available',paymentStatus:'unpaid'}],{session});
   if(member.role==='buyer')await User.updateOne({_id:member._id,role:'buyer'},{$set:{role:'seller'}},{session});
   return created;
  });
  return NextResponse.json({ item: productDto(product) }, { status: 201 });
 } catch (error) { return apiError(error); }
}
