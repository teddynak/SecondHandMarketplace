'use client';
import Link from 'next/link';
import {useCallback,useEffect,useState} from 'react';
import {MessageCircle,ShieldCheck} from 'lucide-react';
import {useAuth} from '@/components/AuthProvider';
import {Notice} from '@/components/Notice';
import Dialog from '@/components/Dialog';
import {refreshInbox} from '@/components/InboxLink';
import {api,niceDate} from '@/lib/client';
import type {ConversationSummary} from '@/types';
type Inbox={conversations:ConversationSummary[];unreadTotal:number;page:number;pages:number};
type Block={userId:string;name:string};
function InboxContent(){
 const {user,ready}=useAuth();const [data,setData]=useState<Inbox|null>(null);const [page,setPage]=useState(1);const [error,setError]=useState('');const [blocks,setBlocks]=useState<Block[]>([]);const [unblock,setUnblock]=useState<Block|null>(null);const [busy,setBusy]=useState(false);const [actionError,setActionError]=useState('');
 const load=useCallback(async()=>{try{const [inbox,blocked]=await Promise.all([api<Inbox>(`/api/conversations?page=${page}`),api<{blocks:Block[]}>('/api/blocks')]);setData(inbox);setBlocks(blocked.blocks);setError('');}catch(error){setError((error as Error).message);}},[page]);
 // Synchronize with the authenticated inbox API.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{if(!user)return;void load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void load();},10000);return()=>clearInterval(timer);},[user,load]);
 async function confirmUnblock(){if(!unblock||busy)return;setBusy(true);setActionError('');try{await api('/api/blocks',{method:'DELETE',body:JSON.stringify({userId:unblock.userId})});setUnblock(null);await load();refreshInbox();}catch(error){setActionError((error as Error).message);}finally{setBusy(false);}}
 if(!ready)return <div className="container page-loading">Checking your session…</div>;
 if(!user)return <div className="container auth-required"><MessageCircle size={40}/><h1>Your conversations, together.</h1><p>Log in to contact sellers and read messages from buyers.</p><Link className="btn btn-primary" href="/login?next=/inbox">Log in to your inbox</Link></div>;
 return <div className="container inbox-page"><div className="collection-heading"><div><span className="section-kicker">BUY. SELL. TALK IT THROUGH.</span><h1>Your inbox</h1><p>Conversations stay linked to the used item you’re discussing.</p></div><Link className="btn btn-outline" href="/marketplace">Find used items</Link></div>
 {error&&<Notice message={error} onRetry={()=>void load()}/>}{!data&&!error&&<div className="page-loading">Loading conversations…</div>}
 {data&&<><p className="inbox-count" role="status">{data.unreadTotal?`${data.unreadTotal} unread message${data.unreadTotal===1?'':'s'}`:'You’re up to date.'}</p>{data.conversations.length===0?<div className="empty-state"><MessageCircle size={40}/><h2>No conversations yet</h2><p>Open a listing and choose Message on ReUse. Replies from buyers will appear here too.</p><Link className="btn btn-primary" href="/marketplace">Explore the marketplace</Link></div>:<div className="conversation-list">{data.conversations.map(c=><Link className={`conversation-card ${c.unread?'conversation-unread':''}`} href={`/inbox/${c.id}`} key={c.id}><div className="conversation-avatar" aria-hidden="true"><MessageCircle size={23}/></div><div className="conversation-copy"><div className="conversation-card-head"><h2>{c.otherName}</h2><time dateTime={c.lastActivityAt}>{niceDate(c.lastActivityAt)}</time></div><h3>{c.listingTitle}</h3><p>{c.lastMessage||'No messages yet. Start with a question about the item.'}</p><span className="conversation-status">{c.blocked?'Messaging blocked':c.listingStatus==='available'?'Listing available':c.listingStatus==='sold'?'Sold · Read only':'Unavailable · Read only'}</span></div>{c.unread>0&&<span className="unread-badge" aria-label={`${c.unread} unread messages`}>{c.unread>99?'99+':c.unread}</span>}</Link>)}</div>}{data.pages>1&&<nav className="chat-pagination" aria-label="Conversation pages"><button className="btn btn-outline" disabled={data.page<=1} onClick={()=>setPage(data.page-1)}>Previous</button><span>Page {data.page} of {data.pages}</span><button className="btn btn-outline" disabled={data.page>=data.pages} onClick={()=>setPage(data.page+1)}>Next</button></nav>}</>}
 {blocks.length>0&&<section className="blocked-members"><h2>Blocked members</h2><p>Blocking stops in-app messages in both directions. It does not block phone calls or WhatsApp.</p>{blocks.map(block=><div key={block.userId}><strong>{block.name}</strong><button className="btn btn-outline btn-small" onClick={()=>{setActionError('');setUnblock(block);}}>Unblock</button></div>)}</section>}
 <div className="chat-safety"><ShieldCheck size={20}/><p>Inspect the item before paying. Never share passwords, PINs or verification codes. Payments and pickup stay between you and the other member.</p></div>
 {unblock&&<Dialog labelledBy="unblock-title" onClose={()=>setUnblock(null)} busy={busy}><h2 id="unblock-title">Unblock {unblock.name}?</h2><p>Messaging can resume if neither member has a block in place and the listing is still available.</p>{actionError&&<p className="form-error" role="alert">{actionError}</p>}<div className="dialog-actions"><button className="btn btn-outline" data-autofocus disabled={busy} onClick={()=>setUnblock(null)}>Cancel</button><button className="btn btn-primary" disabled={busy} onClick={()=>void confirmUnblock()}>{busy?'Unblocking…':'Confirm unblock'}</button></div></Dialog>}
 </div>;
}

export default function InboxPage(){const {user}=useAuth();return <InboxContent key={user?.id??"anonymous"}/>;}
