'use client';
import Link from 'next/link';
import {useCallback,useEffect,useState} from 'react';
import {useAuth} from '@/components/AuthProvider';
import {Notice} from '@/components/Notice';
import {refreshNotifications} from '@/components/NotificationLink';
import {api,niceDate} from '@/lib/client';
type Notification={id:string;title:string;body:string;href:string;read:boolean;createdAt:string};
type Data={notifications:Notification[];unread:number;page:number;pages:number};
function NotificationsContent(){
 const {user,ready}=useAuth();const [data,setData]=useState<Data|null>(null);const [page,setPage]=useState(1);const [error,setError]=useState('');const [busy,setBusy]=useState('');
 const load=useCallback(async()=>{try{setData(await api<Data>(`/api/notifications?page=${page}`));setError('');}catch(error){setError((error as Error).message);}},[page]);
 // Synchronize with the authenticated notification feed.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{if(!user)return;void load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void load();},15000);return()=>clearInterval(timer);},[user,load]);
 async function mark(id:string){setBusy(id);try{await api('/api/notifications',{method:'PATCH',body:JSON.stringify({id})});await load();refreshNotifications();}catch(error){setError((error as Error).message);}finally{setBusy('');}}
 if(!ready)return <div className="container page-loading">Checking your session…</div>;
 if(!user)return <div className="container auth-required"><h1>Your notifications</h1><p>Log in to see message and moderation updates.</p><Link className="btn btn-primary" href="/login?next=/notifications">Log in</Link></div>;
 return <div className="container inbox-page"><div className="collection-heading"><div><span className="section-kicker">UPDATES THAT BELONG TO YOU</span><h1>Notifications</h1><p>Message and moderation events stored in your account.</p></div><Link className="btn btn-outline" href="/inbox">Open inbox</Link></div>{error&&<Notice message={error} onRetry={()=>void load()}/>}{!data&&!error&&<p role="status">Loading notifications…</p>}{data&&<p className="inbox-count" role="status">{data.unread} unread notifications</p>}{data?.notifications.length===0&&<div className="empty-state"><h2>No updates yet</h2><p>New messages and moderation decisions will appear here. Saved searches do not send alerts.</p></div>}{data?.notifications.map(n=><article className={`notification-card ${n.read?'':'notification-unread'}`} key={n.id}><h2>{n.title}</h2><p>{n.body}</p><time dateTime={n.createdAt}>{niceDate(n.createdAt)}</time><div><Link className="btn btn-outline btn-small" href={n.href}>View update</Link>{!n.read&&<button className="btn btn-primary btn-small" disabled={!!busy} onClick={()=>void mark(n.id)}>{busy===n.id?'Saving…':'Mark as read'}</button>}</div></article>)}{data&&data.pages>1&&<nav className="chat-pagination" aria-label="Notification pages"><button className="btn btn-outline" disabled={page<=1} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page} of {data.pages}</span><button className="btn btn-outline" disabled={page>=data.pages} onClick={()=>setPage(page+1)}>Next</button></nav>}</div>;
}

export default function NotificationsPage(){const {user}=useAuth();return <NotificationsContent key={user?.id??"anonymous"}/>;}
