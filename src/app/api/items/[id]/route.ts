import { NextRequest, NextResponse } from 'next/server';
import { isStoredImage } from '@/lib/image-source';
import mongoose,{ Types } from 'mongoose';
import { requireUser, currentUser } from '@/lib/auth';
import { apiError, AppError } from '@/lib/errors';
import { assertSameOrigin, jsonBody, validObjectId } from '@/lib/security';
import { productUpdateSchema, saleSchema, markPaidSchema } from '@/lib/validators';
import { productDto } from '@/lib/serialize';
import {attachStoredImages} from '@/lib/image-storage';
import {userRateLimit} from '@/lib/rate-limit';
import Product from '@/models/Product';
import ImageAsset from '@/models/ImageAsset';
import { connectDb } from '@/lib/db';
export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, { params }: RouteContext) {
 try {
  const { id } = await params;
  if (!validObjectId(id)) throw new AppError('Product not found.', 404);
  await connectDb();
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found.', 404);
  if (product.status !== 'available' || product.condition === 'New' || product.moderationHidden || product.sellerSuspended) {
   const user = await currentUser();
   if (!user || (String(user._id) !== String(product.sellerId) && user.role !== 'admin')) throw new AppError('Product is no longer available.', 404);
  }
  return NextResponse.json({ item: productDto(product) });
 } catch (error) { return apiError(error); }
}
export async function PATCH(request: NextRequest, { params }: RouteContext) {
 try {
  assertSameOrigin(request);
  const { id } = await params;
  if (!validObjectId(id)) throw new AppError('Product not found.', 404);
  const user = await requireUser();
  await userRateLimit(String(user._id),'edit-listing',60,3600);
  const input = await jsonBody(request);
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AppError('Invalid request body.');
  const obj = input as Record<string, unknown>;
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found.', 404);
  if (String(product.sellerId) !== String(user._id)) throw new AppError('You can only modify your own listings.', 403);
  if (product.status === 'archived') throw new AppError('Archived listings cannot be modified.', 409);
  if (obj.action === 'complete-sale') {
   saleSchema.parse(input);
   if (product.status !== 'available') throw new AppError('This product is already sold.', 409);
   product.status = 'sold';
   product.paymentStatus = obj.paid === true ? 'paid' : 'unpaid';
  } else if (obj.action === 'mark-paid') {
   markPaidSchema.parse(input);
   if (product.status !== 'sold') throw new AppError('Only completed sales can be marked paid.', 409);
   product.paymentStatus = 'paid';
  } else {
   if (product.status !== 'available') throw new AppError('Sold products cannot be edited.', 409);
   const updates = productUpdateSchema.parse(input);
   if (updates.images) {
    const ids = updates.images.filter(isStoredImage).map(path => new Types.ObjectId(path.split('/').pop()));
    const count = await ImageAsset.countDocuments({ _id: { $in: ids }, ownerId: user._id });
    if (count !== new Set(ids.map(String)).size) throw new AppError('Some images are not yours.', 403);
   }
   if(updates.images){
    const saved=await mongoose.connection.transaction(async session=>{
     const fresh=await Product.findOne({_id:id,sellerId:user._id,status:'available'}).session(session);if(!fresh)throw new AppError('This listing can no longer be edited.',409);
     await attachStoredImages(updates.images!,String(user._id),session);Object.assign(fresh,updates);await fresh.save({session});return fresh;
    });return NextResponse.json({item:productDto(saved)});
   }
   Object.assign(product, updates);
  }
  await product.save();
  return NextResponse.json({ item: productDto(product) });
 } catch (error) { return apiError(error); }
}
// Intentional: no DELETE handler. Only the admin review API can archive products.
