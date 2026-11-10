import {Types,type ClientSession} from 'mongoose';
import ImageAsset from '@/models/ImageAsset';
import {isStoredImage} from './image-source';
import {AppError} from './errors';
export function imageStorageLimits(){
 const count=Number(process.env.IMAGE_MAX_PER_ACCOUNT||50);const mb=Number(process.env.IMAGE_MAX_TOTAL_MB||64);
 if(!Number.isInteger(count)||count<4||count>500||!Number.isFinite(mb)||mb<8||mb>1024)throw new AppError('Image storage limits are not configured correctly.',503);
 return {count,bytes:Math.floor(mb*1024*1024)};
}
/** Touching assets in the publication transaction conflicts safely with concurrent cleanup. */
export async function attachStoredImages(paths:string[],ownerId:string,session:ClientSession){
 const ids=[...new Set(paths.filter(isStoredImage).map(path=>path.split('/').pop()!))];if(!ids.length)return;
 const result=await ImageAsset.updateMany({_id:{$in:ids.map(id=>new Types.ObjectId(id))},ownerId},{$set:{lastAttachedAt:new Date()}},{session});
 if(result.matchedCount!==ids.length)throw new AppError('An uploaded image is missing or does not belong to your account. Please upload it again.',403);
}
