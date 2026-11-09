import { NextRequest, NextResponse } from 'next/server';
import { currentUser, publicUser, requireUser } from '@/lib/auth';
import { apiError } from '@/lib/errors';
import { assertSameOrigin, jsonBody } from '@/lib/security';
import { profileSchema } from '@/lib/validators';
import Product from '@/models/Product';
export const runtime = 'nodejs';
export async function GET() {
 try { const user = await currentUser(); return NextResponse.json({ user: user ? publicUser(user) : null }); }
 catch (error) { return apiError(error); }
}
export async function PATCH(request: NextRequest) {
 try {
  assertSameOrigin(request);
  const user = await requireUser();
  const details = profileSchema.parse(await jsonBody(request));
  user.name = details.name; user.phone = details.phone; user.location = details.location;
  await user.save();
  // Keep the seller identity and contact info on existing listings in sync with profile updates.
  await Product.updateMany({ sellerId: user._id }, { $set: { sellerName: user.name } });
  return NextResponse.json({ user: publicUser(user) });
 } catch (error) { return apiError(error); }
}
