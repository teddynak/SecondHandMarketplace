import type {MetadataRoute} from 'next';
import {siteOrigin} from '@/lib/seo';
import {connectDb} from '@/lib/db';
import Product from '@/models/Product';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const origin=siteOrigin();if(!origin)return [];
 await connectDb();const items=await Product.find({status:'available',condition:{$ne:'New'},moderationHidden:{$ne:true},sellerSuspended:{$ne:true}}).select('_id sellerId updatedAt').sort({updatedAt:-1,_id:-1}).limit(10000).lean();
 const pages:MetadataRoute.Sitemap=['/','/marketplace','/about','/how-it-works'].map(path=>({url:origin+path}));
 return [...pages,...items.map(item=>({url:`${origin}/items/${item._id}`,lastModified:item.updatedAt})),...Array.from(new Set(items.map(item=>String(item.sellerId)))).map(id=>({url:`${origin}/sellers/${id}`}))];
}
