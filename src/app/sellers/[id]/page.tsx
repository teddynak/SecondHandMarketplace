'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect,useState } from 'react';
import { ArrowLeft, CalendarDays, MapPin, Package } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import { api,initials,niceDate } from '@/lib/client';
import type { Product } from '@/types';
type SellerData={seller:{id:string;name:string;location:string;createdAt:string};items:Product[]};
function SellerContent({id}:{id:string}){
 const [data,setData]=useState<SellerData|null>(null);const [error,setError]=useState('');
 useEffect(()=>{let active=true;api<SellerData>(`/api/sellers/${id}`).then(data=>{if(active)setData(data);}).catch(error=>{if(active)setError(error.message);});return()=>{active=false;};},[id]);
 return <div className="collection-page"><div className="container"><Link href="/marketplace" className="back-link"><ArrowLeft size={17}/> Back to marketplace</Link>{error&&<Notice message={error}/>} {!data&&!error&&<div className="page-loading">Loading seller...</div>}{data&&<><div className="seller-storefront"><div className="store-avatar">{initials(data.seller.name)}</div><div><span className="section-kicker">COMMUNITY SELLER</span><h1>{data.seller.name}</h1><div className="store-meta"><span><MapPin size={16}/>{data.seller.location}</span><span><CalendarDays size={16}/> Member since {niceDate(data.seller.createdAt)}</span><span><Package size={16}/>{data.items.length} available listings</span></div></div></div><div className="section-heading"><h2>From this seller</h2></div>{data.items.length?<div className="products-grid">{data.items.map(item=><ProductCard key={item.id} product={item}/>)}</div>:<EmptyState title="Nothing listed right now" description="This seller has no available items at the moment."/>}</>}</div></div>;
}
export default function SellerPage(){const {id}=useParams<{id:string}>();return <SellerContent key={id} id={id}/>;}
