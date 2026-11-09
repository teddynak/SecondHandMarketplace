'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { Bookmark, Heart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { useSaved } from '@/components/SavedProvider';
import { api } from '@/lib/client';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import type { Product } from '@/types';
type Search={id:string;label:string;params:string};
function SavedContent(){
 const {user,ready}=useAuth();const {ids,ready:savedReady}=useSaved();const [items,setItems]=useState<Product[]|null>(null);const [searches,setSearches]=useState<Search[]>([]);const [error,setError]=useState('');const [busy,setBusy]=useState('');const signature=ids.join(',');
 useEffect(()=>{let active=true;if(user&&savedReady)Promise.all([api<{items:Product[]}>('/api/favorites'),api<{searches:Search[]}>('/api/saved-searches')]).then(([favorites,saved])=>{if(active){setItems(favorites.items);setSearches(saved.searches);setError('');}}).catch(error=>{if(active)setError(error.message);});return()=>{active=false;};},[user,savedReady,signature]);
 async function remove(id:string){setBusy(id);try{await api('/api/saved-searches',{method:'DELETE',body:JSON.stringify({id})});setSearches(values=>values.filter(value=>value.id!==id));toast.success('Search removed.');}catch(error){toast.error((error as Error).message);}finally{setBusy('');}}
 if(!ready)return <div className="container page-loading">Loading your collection...</div>;
 if(!user)return <div className="container auth-required"><Heart size={36}/><h1>Your next find, saved for later.</h1><p>Sign in to keep your items and searches across devices.</p><Link className="btn btn-primary" href="/login?next=%2Fsaved">Log in to save items</Link></div>;
 return <div className="collection-page"><div className="container"><div className="collection-heading"><div><span className="section-kicker">YOUR PERSONAL COLLECTION</span><h1>Good finds. Kept close<span className="accent-dot">.</span></h1><p>Items and searches you want to come back to.</p></div><Link className="btn btn-outline" href="/marketplace">Explore more</Link></div>{error&&<Notice message={error}/>}<section className="saved-search-section"><h2><Bookmark size={22}/> Saved searches</h2><p>Reopen your filters in one tap. Search alerts are not enabled.</p><div className="saved-search-list">{searches.map(search=><div className="saved-search-item" key={search.id}><Link href={`/marketplace?${search.params}`}>{search.label}</Link><button disabled={busy===search.id} onClick={()=>void remove(search.id)} aria-label={`Delete saved search ${search.label}`}><Trash2 size={17}/></button></div>)}</div>{!searches.length&&<p className="subtle-empty">Use “Save search” in the marketplace to add one.</p>}</section><section><div className="section-heading"><h2><Heart size={25}/> Saved items</h2><span>{items?.length??0} available</span></div><p className="collection-note">Sold and archived items are hidden automatically.</p>{!items&&!error?<div className="page-loading">Loading saved items...</div>:items?.length?<div className="products-grid">{items.map(item=><ProductCard product={item} key={item.id}/>)}</div>:!error&&<EmptyState title="Make room for your favourites" description="Tap the heart on any listing to keep it here."/>}</section></div></div>;
}

export default function SavedPage(){const {user}=useAuth();return <SavedContent key={user?.id??'guest'}/>;}
