'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, ChevronRight, Cpu, Leaf, MapPin, PackageOpen, Recycle, Search, ShieldCheck, Shirt, Sofa, Sparkles } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/client';
import type { PaginatedProducts } from '@/types';
import EmptyState from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
const categories = [
 { name: 'Clothing', icon: Shirt, cls: 'category-peach', caption: 'Find your next favorite' },
 { name: 'Electronics', icon: Cpu, cls: 'category-lilac', caption: 'Tech with more life' },
 { name: 'Books', icon: BookOpen, cls: 'category-blue', caption: 'Stories worth sharing' },
 { name: 'Home & Living', icon: Sofa, cls: 'category-sand', caption: 'Make a space yours' },
];
export default function Home() {
 const router = useRouter(); const [query, setQuery] = useState('');
 const [data, setData] = useState<PaginatedProducts | null>(null); const [error, setError] = useState('');
 useEffect(() => { let active = true; api<PaginatedProducts>('/api/items?limit=8').then(d => { if(active) setData(d); }).catch(e => { if(active) setError(e.message); }); return () => { active = false; }; }, []);
 function submit(e: FormEvent) { e.preventDefault(); router.push(`/marketplace?q=${encodeURIComponent(query.trim())}`); }
 return <>
  <section className="hero"><div className="container hero-grid">
   <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> THE COMMUNITY REUSE MARKETPLACE</div>
    <h1>Good things<br/>deserve a <span className="scribble-word">second<span className="scribble-line"/></span><br/>story<span className="hero-period">.</span></h1>
    <p className="hero-description">Find something you love. Give something you don’t need a new home. A better way to buy, sell, and make less waste.</p>
    <form onSubmit={submit} className="hero-search"><Search size={21}/><input aria-label="Search the marketplace" value={query} onChange={e => setQuery(e.target.value)} placeholder="What are you looking for?"/><button type="submit" aria-label="Search"><ArrowRight size={21}/></button></form>
    <div className="hero-links"><Link href="/marketplace" className="hero-text-link">Explore listings <ArrowUpRight size={16}/></Link><span className="hero-link-divider"/><Link href="/sell" className="hero-text-link">Sell something <ArrowUpRight size={16}/></Link></div>
   </div>
   <div className="hero-visual" aria-label="Second-hand goods ready for a new home">
    <div className="hero-photo hero-photo-main"><div className="hero-photo-caption">a little less waste,<br/><strong>a lot more life.</strong></div></div>
    <div className="hero-photo hero-photo-side"/>
    <div className="hero-sticker"><Recycle size={27}/><span>Love it.<br/><strong>Reuse it.</strong></span></div>
    <div className="hero-sparkle"><Sparkles size={27}/></div>
   </div>
  </div></section>
  <div className="benefit-strip"><div className="container benefit-inner"><span><Leaf size={18}/> Better for the planet</span><i/><span><ShieldCheck size={19}/> Direct community connections</span><i/><span><Recycle size={18}/> More life for good things</span></div></div>
  <section className="section categories-section"><div className="container"><div className="section-heading"><div><span className="section-kicker">BROWSE BY CATEGORY</span><h2>What are you looking for?</h2><p>A little bit of everything, just around the corner.</p></div><Link href="/marketplace" className="section-action">View everything <ArrowUpRight size={18}/></Link></div>
  <div className="categories-grid">{categories.map(c => <Link key={c.name} href={`/marketplace?category=${encodeURIComponent(c.name)}`} className={`category-card ${c.cls}`}><div className="category-art"><c.icon size={47} strokeWidth={1.4}/></div><div><h3>{c.name}</h3><p>{c.caption}</p></div><span className="category-arrow"><ArrowUpRight size={20}/></span></Link>)}</div>
  </div></section>
  <section className="section latest-section"><div className="container"><div className="section-heading"><div><span className="section-kicker">FRESH FINDS</span><h2>Just listed, just for you<span className="accent-dot">.</span></h2><p>Discover what your community is passing on.</p></div><Link href="/marketplace" className="section-action">Browse all listings <ArrowUpRight size={18}/></Link></div>
   {error && <Notice message={error}/>}
   {!data && !error ? <div className="card-loading-grid">{Array.from({ length: 4 }, (_, i) => <div className="loading-card" key={i}/>)}</div> : data?.items.length ? <div className="products-grid">{data.items.map(p => <ProductCard product={p} key={p.id}/>)}</div> : !error && <EmptyState title="Your community's next find starts here" description="No active listings yet. Have something useful at home? Be the first to share it."/>}
  </div></section>
  <section className="mission-banner"><div className="container mission-grid"><div className="mission-symbol"><Recycle size={103} strokeWidth={1.2}/><span className="mission-star mission-star-one">✳</span><span className="mission-star mission-star-two">✳</span></div><div><span className="section-kicker section-kicker-light">SMALL ACTIONS, BIG DIFFERENCE</span><h2>Less waste. More wonder.</h2><p>One person’s unused item is another person’s perfect find. Join a community that sees value in giving things another go.</p><Link href="/about" className="btn btn-cream">Why we do this <ArrowRight size={18}/></Link></div></div></section>
  <section className="section steps-section"><div className="container"><div className="section-heading"><div><span className="section-kicker">SO SIMPLE</span><h2>Pass it on in 3 easy steps</h2></div></div><div className="steps-grid"><div className="step-card"><div className="step-number">01</div><div className="step-icon"><PackageOpen size={32}/></div><h3>Find or list an item</h3><p>Browse pre-loved goods, or post something you no longer need in minutes.</p></div><ChevronRight className="step-chevron" size={29}/><div className="step-card"><div className="step-number">02</div><div className="step-icon"><MapPin size={32}/></div><h3>Connect directly</h3><p>Chat with the seller, ask questions, and arrange the details together.</p></div><ChevronRight className="step-chevron" size={29}/><div className="step-card"><div className="step-number">03</div><div className="step-icon"><CheckCircle2 size={32}/></div><h3>Give it a new story</h3><p>Complete the exchange. Sellers confirm the sale and the listing comes down.</p></div></div></div></section>
  <section className="container bottom-cta"><div><span>READY TO MAKE SPACE?</span><h2>Someone out there needs<br/>what you no longer use.</h2><p>Make someone’s day. Make a little extra. Make less waste.</p></div><Link href="/sell" className="btn btn-white">List an item for free <ArrowRight size={19}/></Link><div className="cta-decoration">✳</div></section>
 </>;
}
