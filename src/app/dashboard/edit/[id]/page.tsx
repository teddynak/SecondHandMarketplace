'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import ListingForm from '@/components/ListingForm';
import { Notice } from '@/components/Notice';
import { api } from '@/lib/client';
import { listingStatusDescription } from '@/lib/listing-status';
import type { Product } from '@/types';
function EditContent() {
 const { id } = useParams<{id:string}>(); const { user,ready } = useAuth();
 const [item,setItem] = useState<Product|null>(null);const [error,setError] = useState('');
 useEffect(()=>{if(!user)return;let active=true;api<{item:Product}>(`/api/items/${id}`).then(d=>{if(active)setItem(d.item);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[id,user]);
 if(!ready)return <div className="container page-loading">Loading...</div>;
 if(!user)return <div className="container auth-required"><h1>Please log in to edit a listing.</h1><Link className="btn btn-primary" href={`/login?next=${encodeURIComponent(`/dashboard/edit/${id}`)}`}>Log in</Link></div>;
 return <div className="form-page"><div className="container form-page-container"><Link className="back-link" href="/dashboard"><ArrowLeft size={17}/> Back to dashboard</Link><div className="form-page-heading"><span className="section-kicker">KEEP IT UP TO DATE</span><h1>Edit your listing<span className="accent-dot">.</span></h1><p>Update your item details to help it find the right buyer.</p></div>
 {error && <Notice message={error}/>} {!item&&!error&&<div className="page-loading" role="status">Loading listing details...</div>}{item && user.id !== item.sellerId && <Notice message="You can only edit your own listings."/>}{item && item.status !== 'available' && <Notice message={listingStatusDescription(item)}/>}{item && user.id === item.sellerId && item.status === 'available' && <ListingForm key={item.id} product={item}/>}</div></div>;
}

export default function EditPage() { const { id } = useParams<{id:string}>(); return <EditContent key={id}/>; }
