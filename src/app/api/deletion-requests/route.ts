import {userRateLimit} from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { apiError, AppError } from '@/lib/errors';
import { assertSameOrigin, jsonBody } from '@/lib/security';
import { deletionSchema } from '@/lib/validators';
import Product from '@/models/Product';
import DeletionRequest from '@/models/DeletionRequest';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
 try {
  assertSameOrigin(request);
  const user = await requireUser();
  await userRateLimit(String(user._id),'removal-request',10,3600);
  const { productId, reason } = deletionSchema.parse(await jsonBody(request));
  const item = await Product.findById(productId);
  if (!item || item.status === 'archived') throw new AppError('Listing not found.', 404);
  if (String(item.sellerId) !== String(user._id)) throw new AppError('Only the listing owner may request deletion.', 403);
  if (await DeletionRequest.exists({ productId, status: 'pending' })) throw new AppError('There is already a pending deletion request.', 409);
  const record = await DeletionRequest.create({ productId, reason, requestedBy: user._id });
  return NextResponse.json({ id: String(record._id), status: 'pending' }, { status: 201 });
 } catch (error) { return apiError(error); }
}
