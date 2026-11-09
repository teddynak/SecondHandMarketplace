import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { apiError, AppError } from '@/lib/errors';
import { assertSameOrigin, jsonBody, validObjectId } from '@/lib/security';
import { decisionSchema } from '@/lib/validators';
import Product from '@/models/Product';
import DeletionRequest from '@/models/DeletionRequest';
export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, { params }: RouteContext) {
 try {
  assertSameOrigin(request);
  const admin = await requireAdmin();
  const { id } = await params;
  if (!validObjectId(id)) throw new AppError('Request not found.', 404);
  const { decision, adminNote } = decisionSchema.parse(await jsonBody(request));
  const record = await DeletionRequest.findById(id);
  if (!record) throw new AppError('Request not found.', 404);
  if (record.status !== 'pending') throw new AppError('This request has already been reviewed.', 409);
  if (decision === 'approved') {
   const product = await Product.findById(record.productId);
   if (!product) throw new AppError('Associated listing not found.', 404);
   product.status = 'archived';
   await product.save();
  }
  record.status = decision; record.adminNote = adminNote || ''; record.reviewedBy = admin._id; record.reviewedAt = new Date();
  await record.save();
  return NextResponse.json({ ok: true, status: record.status });
 } catch (error) { return apiError(error); }
}
