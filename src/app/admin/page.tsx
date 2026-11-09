'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCircle2, Clock3, LoaderCircle, Package, ShieldCheck, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { Notice } from '@/components/Notice';
import { api, niceDate } from '@/lib/client';
import type { DeletionRequest } from '@/types';
type AdminData = { requests: DeletionRequest[]; stats: { available:number; sold:number; pending:number; users:number } };
export default function AdminPage() {
 const {user,ready}=useAuth();const [data,setData]=useState<AdminData|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState('');
 const reload=useCallback(async()=>{try{const result=await api<AdminData>('/api/admin/deletion-requests');setData(result);setError('');}catch(e){setError((e as Error).message);}},[]);
 // Synchronize state with the external session, URL or network request.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{if(user?.role==='admin')void reload();},[user,reload]);
 async function decide(item:DeletionRequest,decision:'approved'|'rejected') {
  setBusy(item.id);try{await api(`/api/admin/deletion-requests/${item.id}`,{method:'PATCH',body:JSON.stringify({decision})});toast.success(decision==='approved'?'Request approved. Item archived.':'Request rejected. Listing remains.');await reload();}catch(e){toast.error((e as Error).message);}finally{setBusy('');}
 }
 if(!ready)return <div className="container page-loading">Checking permissions...</div>;
 if(user?.role!=='admin')return <div className="container auth-required"><ShieldCheck size={40}/><h1>Administrator access only</h1><p>This area is reserved for authorized marketplace administrators.</p><Link className="btn btn-primary" href="/">Back home</Link></div>;
 return <div className="dashboard-page admin-page"><div className="container"><Link href="/dashboard" className="back-link"><ArrowLeft size={17}/> Back to my dashboard</Link><div className="dashboard-top"><div><span className="section-kicker">ADMINISTRATION CENTER</span><h1>Keep ReUse thriving<span className="accent-dot">.</span></h1><p>Review deletion requests and keep the community marketplace healthy.</p></div><div className="admin-symbol"><ShieldCheck size={32}/></div></div>
 {error&&<Notice message={error}/>}<div className="dashboard-stats"><div className="stat-card"><div className="stat-icon stat-gold"><Clock3/></div><div><span>Pending requests</span><strong>{data?.stats.pending ?? '—'}</strong></div></div><div className="stat-card"><div className="stat-icon stat-green"><Package/></div><div><span>Available items</span><strong>{data?.stats.available ?? '—'}</strong></div></div><div className="stat-card"><div className="stat-icon stat-blue"><CheckCircle2/></div><div><span>Sold items</span><strong>{data?.stats.sold ?? '—'}</strong></div></div><div className="stat-card"><div className="stat-icon stat-purple"><Users/></div><div><span>Community members</span><strong>{data?.stats.users ?? '—'}</strong></div></div></div>
 <section className="admin-requests"><div className="dashboard-section-head"><div><h2>Listing removal requests</h2><p>Only administrators may approve or reject deletion requests.</p></div></div>
 {!data&&!error&&<div className="page-loading">Loading requests...</div>}{data?.requests.length===0&&<div className="empty-state"><CheckCircle2 size={40}/><h3>All caught up!</h3><p>There are no deletion requests to review.</p></div>}
 <div className="requests-list">{data?.requests.map(req=><article className="request-card" key={req.id}><div className="request-main"><div className="request-title-row"><h3>{req.productTitle}</h3><span className={`badge badge-${req.status}`}>{req.status}</span></div><p className="request-meta">Requested by {req.sellerName} ({req.sellerEmail}) · {niceDate(req.createdAt)}</p><div className="request-reason">“{req.reason}”</div></div><div className="request-actions"><Link href={`/items/${req.productId}`} className="btn btn-outline btn-small">View listing</Link>{req.status==='pending'&&<><button className="btn btn-outline btn-small" onClick={()=>void decide(req,'rejected')} disabled={!!busy}><X size={16}/> Reject</button><button className="btn btn-primary btn-small" onClick={()=>void decide(req,'approved')} disabled={!!busy}>{busy===req.id?<LoaderCircle className="spin" size={17}/>:<Check size={16}/>} Approve & archive</button></>}</div></article>)}</div>
 </section></div></div>;
}
