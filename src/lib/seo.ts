import {cache} from 'react';
import {connectDb} from './db';
import {validObjectId} from './security';
import Product from '@/models/Product';
export function siteOrigin(){
 try{const url=new URL(process.env.APP_URL||'');if(url.username||url.password||url.pathname!=='/'||url.search||url.hash)return null;if(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))return url.origin;}catch{}
 return null;
}
export const publicSeoListing=cache(async(id:string)=>{
 if(!validObjectId(id))return null;
 await connectDb();return Product.findOne({_id:id,status:'available',condition:{$ne:'New'},moderationHidden:{$ne:true},sellerSuspended:{$ne:true}}).select('title description price images location category updatedAt sellerId').lean();
});
export function safeJsonLd(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c');}
