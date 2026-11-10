import RateBucket from '@/models/RateBucket';
import {AppError} from './errors';
/** Shared across application instances; TTL is cleanup, not the enforcement clock. */
export async function userRateLimit(userId:string,action:string,limit:number,seconds=60){
 const window=Math.floor(Date.now()/(seconds*1000));
 const _id=`${action}:${userId}:${window}`;
 const bucket=await RateBucket.findOneAndUpdate({_id},{$inc:{count:1},$setOnInsert:{expiresAt:new Date((window+2)*seconds*1000)}},{upsert:true,returnDocument:'after'});
 if(bucket.count>limit)throw new AppError('Too many attempts. Please wait before trying again.',429,Math.max(1,Math.ceil(((window+1)*seconds*1000-Date.now())/1000)));
}

// This header must be overwritten by the trusted hosting proxy. Missing IPs share a bucket.
export async function requestRateLimit(request:Request,action:string,limit:number,seconds=60){
 const {createHash}=await import('node:crypto');
 const ip=(request.headers.get('x-real-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown').trim().slice(0,100);
 const identity=createHash('sha256').update(`${process.env.AUTH_SECRET||'unconfigured'}:${ip}`).digest('hex');
 await userRateLimit(identity,action,limit,seconds);
}
