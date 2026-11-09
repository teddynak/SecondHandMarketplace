'use client';
import { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import { api } from '@/lib/client';
import type { PaginatedProducts } from '@/types';
import { CATEGORIES, CONDITIONS } from '@/types';
function MarketContent() {
 const router = useRouter(); const search = useSearchParams();
 const [query, setQuery] = useState(search.get('q') ?? ''); const [min, setMin] = useState(search.get('minPrice') ?? ''); const [max, setMax] = useState(search.get('maxPrice') ?? '');
 const [data, setData] = useState<PaginatedProducts | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [mobileFilters, setMobileFilters] = useState(false);
 const currentCategory = search.get('category') ?? ''; const currentCondition = search.get('condition') ?? ''; const currentSort = search.get('sort') ?? 'newest'; const page = Math.max(1, Number(search.get('page')) || 1);
 const update = useCallback((updates: Record<string, string>) => { const params = new URLSearchParams(search.toString()); Object.entries(updates).forEach(([key,value]) => { if (value) params.set(key,value); else params.delete(key); }); if(!('page' in updates)) params.delete('page'); router.push(`/marketplace?${params.toString()}`); }, [router,search]);
 // Synchronize state with the external session, URL or network request.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(() => { let active = true; setLoading(true); setError(''); api<PaginatedProducts>(`/api/items?${search.toString()}`).then(d => { if(active) setData(d); }).catch(e => { if(active){ setError(e.message); setData(null); } }).finally(() => { if(active) setLoading(false); }); return () => { active = false; }; }, [search]);
 // Synchronize state with the external session, URL or network request.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(() => { setQuery(search.get('q') ?? ''); setMin(search.get('minPrice') ?? ''); setMax(search.get('maxPrice') ?? ''); },[search]);
 return <div className="market-page"><div className="page-hero-light"><div className="container"><span className="section-kicker">DISCOVER YOUR NEXT FIND</span><h1>Explore the marketplace<span className="accent-dot">.</span></h1><p>Thoughtful finds from people in your community.</p></div></div>
 <div className="container market-layout"><aside className={`filter-sidebar ${mobileFilters ? 'filter-open' : ''}`}><div className="filter-head"><h3><SlidersHorizontal size={19}/> Filters</h3><button className="filter-close" aria-label="Close filters" onClick={() => setMobileFilters(false)}><X/></button></div>
 <div className="filter-group"><h4>Categories</h4><button className={`filter-category ${!currentCategory ? 'selected' : ''}`} onClick={() => update({category:''})}>All categories <span>↗</span></button>{CATEGORIES.map(c => <button key={c} className={`filter-category ${currentCategory === c ? 'selected':''}`} onClick={() => update({category:c})}>{c}</button>)}</div>
 <div className="filter-group"><h4>Condition</h4><select className="input" aria-label="Filter by condition" value={currentCondition} onChange={e => update({condition:e.target.value})}><option value="">Any condition</option>{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select></div>
 <form className="filter-group" onSubmit={e => { e.preventDefault(); update({ minPrice:min, maxPrice:max }); setMobileFilters(false); }}><h4>Price range (UGX)</h4><div className="range-inputs"><input className="input" type="number" min="0" placeholder="Min" aria-label="Minimum price" value={min} onChange={e => setMin(e.target.value)}/><span>–</span><input className="input" type="number" min="0" placeholder="Max" aria-label="Maximum price" value={max} onChange={e => setMax(e.target.value)}/></div><button type="submit" className="btn btn-outline btn-filter">Apply price <ArrowRight size={16}/></button></form>
 <button className="clear-filter" onClick={() => { setMin('');setMax(''); setQuery('');router.push('/marketplace'); setMobileFilters(false); }}>Clear all filters</button>
 </aside>
 <div className="market-results"><form className="market-search" onSubmit={e => {e.preventDefault();update({q:query});}}><Search size={19}/><input aria-label="Search products" placeholder="Search by item, keyword or location..." value={query} onChange={e => setQuery(e.target.value)}/><button className="btn btn-primary btn-small" type="submit">Search</button></form>
 <div className="results-toolbar"><div><span className="result-count">{loading ? 'Finding good things...' : `${data?.total ?? 0} available items`}</span>{currentCategory && <span className="active-filter-chip">{currentCategory} <button onClick={() => update({category:''})} aria-label="Remove category filter"><X size={13}/></button></span>}</div><button className="mobile-filter-btn" onClick={() => setMobileFilters(v=>!v)}><SlidersHorizontal size={16}/> Filters</button><label className="sort-select">Sort by <select value={currentSort} onChange={e => update({sort:e.target.value})}><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
 {error && <Notice message={error}/>} {loading ? <div className="products-grid"><div className="loading-card"/><div className="loading-card"/><div className="loading-card"/></div> : data?.items.length ? <><div className="products-grid">{data.items.map(p=><ProductCard key={p.id} product={p}/>)}</div><div className="pagination"><button className="btn btn-outline" disabled={page <= 1} onClick={() => update({page:String(page-1)})}>Previous</button><span>Page {data.page} of {data.pages}</span><button className="btn btn-outline" disabled={page >= data.pages} onClick={() => update({page:String(page+1)})}>Next</button></div></> : !error && <EmptyState title="No matches this time" description="Try a different keyword or fewer filters, or be the first to list something."/>}
 </div></div></div>;
}
export default function MarketplacePage() { return <Suspense fallback={<div className="container page-loading">Loading marketplace...</div>}><MarketContent/></Suspense>; }
