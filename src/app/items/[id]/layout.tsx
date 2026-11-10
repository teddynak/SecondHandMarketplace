import type {Metadata} from 'next';
import {publicSeoListing,safeJsonLd,siteOrigin} from '@/lib/seo';
export const dynamic='force-dynamic';
type Props={children:React.ReactNode;params:Promise<{id:string}>};
export async function generateMetadata({params}:Omit<Props,'children'>):Promise<Metadata>{
 try{const {id}=await params;const item=await publicSeoListing(id);if(!item)return {title:'Listing unavailable',robots:{index:false,follow:false}};
 const origin=siteOrigin();const description=`UGX ${item.price.toLocaleString('en-UG')} · ${item.location}. ${item.description}`.slice(0,180);const images=item.images.slice(0,1).flatMap(src=>src.startsWith('https://')?[{url:src,alt:item.title}]:origin?[{url:origin+src,alt:item.title}]:[]);
 return {title:item.title,description,alternates:origin?{canonical:`${origin}/items/${id}`}:undefined,openGraph:{title:item.title,description,type:'website',locale:'en_UG',url:origin?`${origin}/items/${id}`:undefined,...(images.length?{images}:{})},twitter:{card:images.length?'summary_large_image':'summary',title:item.title,description,...(images.length?{images:images.map(i=>i.url)}:{})}};
 }catch{return {title:'Listing unavailable',robots:{index:false,follow:false}};}
}
export default async function ListingLayout({children,params}:Props){
 let structured:unknown=null;try{const {id}=await params;const origin=siteOrigin();const item=await publicSeoListing(id);if(item&&origin)structured={'@context':'https://schema.org','@type':'Product',name:item.title,description:item.description,image:item.images.map(src=>src.startsWith('/')?origin+src:src),category:item.category,offers:{'@type':'Offer',priceCurrency:'UGX',price:item.price,availability:'https://schema.org/InStock',itemCondition:'https://schema.org/UsedCondition',url:`${origin}/items/${id}`}};}catch{/* Keep the client error/retry experience when the database is unavailable. */}
 return <>{structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(structured)}}/>}{children}</>;
}
