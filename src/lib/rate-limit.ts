import RateBucket from '@/models/RateBucket';
import {AppError} from './errors';
/** Shared across application instances; TTL is cleanup, not the enforcement clock. */
export async function userRateLimit(userId:string,action:string,limit:number,seconds=60){
 const window=Math.floor(Date.now()/(seconds*1000));
 const _id=`${action}:${userId}:${window}`;
 const bucket=await RateBucket.findOneAndUpdate({_id},{$inc:{count:1},$setOnInsert:{expiresAt:new Date((window+2)*seconds*1000)}},{upsert:true,new:true});
 if(bucket.count>limit)throw new AppError('Too many attempts. Please wait before trying again.',429);
}
