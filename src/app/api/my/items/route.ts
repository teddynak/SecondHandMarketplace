import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError } from '@/lib/errors';
import { productDto } from '@/lib/serialize';
import Product from '@/models/Product';
import DeletionRequest from '@/models/DeletionRequest';
export const runtime = 'nodejs';
export async function GET() {
 try {
  const user = await requireUser();
  const items = await Product.find({ sellerId: user._id }).sort({ createdAt: -1 }).lean();
  const pending = await DeletionRequest.find({ requestedBy: user._id, status: 'pending' }).lean();
  const pendingSet = new Set(pending.map(r => String(r.productId)));
  return NextResponse.json({ items: items.map(p => productDto(p, pendingSet.has(String(p._id)) ? 'pending' : null)) });
 } catch (error) { return apiError(error); }
}
