'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, CheckCircle2, Copy, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import ProductImage from '@/components/ProductImage';
import { Notice } from '@/components/Notice';
import { api, money, niceDate, initials, whatsappLink } from '@/lib/client';
import type { Product } from '@/types';
export default function ProductDetailPage() {
 const { id } = useParams<{id:string}>(); const { user } = useAuth();
 const [item,setItem] = useState<Product|null>(null); const [error,setError] = useState('');const [activeImage,setActiveImage] = useState(0);
 // Synchronize state with the external session, URL or network request.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{let active=true;setItem(null);setError('');setActiveImage(0);api<{item:Product}>(`/api/items/${id}`).then(d=>{if(active)setItem(d.item);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[id]);
 async function share(){ try { const url = window.location.href; if (navigator.share) await navigator.share({ title:item?.title,url }); else { await navigator.clipboard.writeText(url); toast.success('Listing link copied!'); } } catch(e){if((e as Error).name!=='AbortError')toast.error('Could not share the link.');} }
 return <div className="detail-page"><div className="container"><Link href="/marketplace" className="back-link"><ArrowLeft size={17}/> Back to marketplace</Link>
 {error && <Notice message={error}/>}{!item && !error && <div className="page-loading">Loading item details...</div>}
 {item && <><div className="detail-grid"><div className="detail-images"><div className="detail-main-image"><ProductImage src={item.images[activeImage]} alt={item.title}/>{item.status!=='available' && <div className="sold-overlay">{item.status === 'sold' ? 'SOLD' : 'UNAVAILABLE'}</div>}</div>{item.images.length > 1 && <div className="image-thumbs">{item.images.map((im,i)=><button key={im} aria-label={`Show image ${i+1}`} className={activeImage===i?'active':''} onClick={()=>setActiveImage(i)}><ProductImage src={im} alt={`View ${i+1}`}/></button>)}</div>}</div>
 <div className="detail-info"><div className="detail-breadcrumb">{item.category} <span>•</span> {item.condition}</div><h1>{item.title}</h1><div className="detail-price">{money(item.price)}</div><div className="detail-metadata"><span><MapPin size={17}/>{item.location}</span><span><CalendarDays size={17}/> Listed {niceDate(item.createdAt)}</span></div>
 <div className="detail-divider"/><div className="detail-condition"><ShieldCheck size={20}/><div><strong>Condition: {item.condition}</strong><p>Ask the seller for full details and arrange a viewing if possible.</p></div></div>
 <div className="detail-divider"/><h3>About this item</h3><p className="detail-description">{item.description}</p>
 <div className="seller-panel"><div className="seller-label">MEET THE SELLER</div><div className="seller-identity"><div className="avatar seller-avatar">{initials(item.sellerName)}</div><div><strong>{item.sellerName}</strong><span><MapPin size={13}/>{item.location}</span></div></div>
 {item.status === 'available' ? <><a className="btn btn-primary btn-block" target="_blank" rel="noopener noreferrer" href={whatsappLink(item.sellerPhone,item.title)}><MessageCircle size={19}/> Message on WhatsApp <ArrowUpRight size={16}/></a><div className="seller-contact-actions"><a className="btn btn-outline" href={`tel:${item.sellerPhone.replace(/[^+\d]/g,'')}`}><Phone size={17}/> Call seller</a><a className="btn btn-outline" href={`mailto:${encodeURIComponent(item.sellerEmail)}?subject=${encodeURIComponent(`Question about: ${item.title}`)}`}><Mail size={17}/> Email seller</a></div><span className="contact-hint">Seller phone: {item.sellerPhone}<br/>Email: {item.sellerEmail}</span></> : <div className="status-notice"><CheckCircle2 size={19}/> This item is no longer available.</div>}
 </div><div className="detail-end"><button onClick={()=>void share()}><Copy size={17}/> Share this listing</button>{user?.id===item.sellerId && <Link href="/dashboard">Manage this listing <ArrowUpRight size={16}/></Link>}</div>
 </div></div><div className="safety-tip"><ShieldCheck size={21}/><div><strong>Stay safe when buying second-hand.</strong><span>Meet in a safe public place, inspect items before paying, and never share sensitive account information.</span></div></div></>}
 </div></div>;
}
