import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { apiError } from '@/lib/errors';
import { deletionDto } from '@/lib/serialize';
import DeletionRequest from '@/models/DeletionRequest';
import Product from '@/models/Product';
import User from '@/models/User';
export const runtime = 'nodejs';
export async function GET() {
 try {
  await requireAdmin();
  const [requests, productsCount, soldCount, usersCount, pendingCount] = await Promise.all([
   DeletionRequest.find().sort({ createdAt: -1 }).limit(150).lean(),
   Product.countDocuments({ status: 'available', condition: { $ne: 'New' },moderationHidden:{$ne:true},sellerSuspended:{$ne:true} }),
   Product.countDocuments({ status: 'sold' }),
   User.countDocuments(),
   DeletionRequest.countDocuments({ status: 'pending' })
  ]);
  const productIds = requests.map(r => r.productId);
  const userIds = requests.map(r => r.requestedBy);
  const [products, users] = await Promise.all([
   Product.find({ _id: { $in: productIds } }).select('title').lean(),
   User.find({ _id: { $in: userIds } }).select('name email').lean()
  ]);
  const productsMap = new Map(products.map(p => [String(p._id), p]));
  const usersMap = new Map(users.map(u => [String(u._id), u]));
  return NextResponse.json({ requests: requests.map(r => deletionDto(r, productsMap.get(String(r.productId)) ?? null, usersMap.get(String(r.requestedBy)) ?? null)), stats: { available: productsCount, sold: soldCount, users: usersCount, pending: pendingCount } });
 } catch (error) { return apiError(error); }
}
