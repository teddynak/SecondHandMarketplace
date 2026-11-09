import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { assertSameOrigin, jsonBody } from '@/lib/security';
import { apiError, AppError } from '@/lib/errors';
import { canonicalSearch, searchLabel } from '@/lib/search';
import User from '@/models/User';
export async function GET(){try{const user=await requireUser();return NextResponse.json({searches:user.savedSearches});}catch(error){return apiError(error);}}
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);const user=await requireUser();const input=z.object({params:z.string().max(1500)}).parse(await jsonBody(request));
  let params:string;try{params=canonicalSearch(input.params);}catch(error){throw new AppError((error as Error).message);}
  const id=createHash('sha256').update(params).digest('hex').slice(0,24);
  if(!user.savedSearches.some(item=>item.id===id)){
   const result=await User.updateOne({_id:user._id,'savedSearches.19':{$exists:false},'savedSearches.id':{$ne:id}},{$push:{savedSearches:{id,label:searchLabel(params),params}}});
   if(!result.matchedCount&&!await User.exists({_id:user._id,'savedSearches.id':id}))throw new AppError('You can save up to 20 searches. Remove one to save another.',409);
  }
  return NextResponse.json({id,label:searchLabel(params),params});
 }catch(error){return apiError(error);}
}
export async function DELETE(request:NextRequest){try{assertSameOrigin(request);const user=await requireUser();const {id}=z.object({id:z.string().regex(/^[a-f0-9]{24}$/)}).parse(await jsonBody(request));await User.updateOne({_id:user._id},{$pull:{savedSearches:{id}}});return NextResponse.json({ok:true});}catch(error){return apiError(error);}}
