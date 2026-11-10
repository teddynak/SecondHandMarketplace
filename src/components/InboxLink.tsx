'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {MessageCircle} from 'lucide-react';
import {useAuth} from './AuthProvider';
import {api} from '@/lib/client';
export function refreshInbox(){window.dispatchEvent(new Event('reuse-inbox-changed'));}
export default function InboxLink({mobile=false}:{mobile?:boolean}){
 const {user}=useAuth();const [unread,setUnread]=useState(0);
 useEffect(()=>{let active=true;if(!user)return;async function load(){if(document.visibilityState==='hidden')return;try{const data=await api<{unreadTotal:number}>('/api/conversations');if(active)setUnread(data.unreadTotal);}catch{/* Inbox itself displays recoverable errors. */}}void load();const timer=setInterval(()=>void load(),30000);const listener=()=>void load();window.addEventListener('reuse-inbox-changed',listener);document.addEventListener('visibilitychange',listener);return()=>{active=false;clearInterval(timer);window.removeEventListener('reuse-inbox-changed',listener);document.removeEventListener('visibilitychange',listener);};},[user]);
 if(!user)return null;
 return <Link href="/inbox" className={mobile?'inbox-nav-mobile':'icon-btn inbox-nav'} aria-label={`Inbox${unread?`, ${unread} unread messages`:''}`} title="Inbox"><MessageCircle size={20}/>{mobile&&'Inbox'}{unread>0&&<span className="unread-badge" aria-hidden="true">{unread>99?'99+':unread}</span>}</Link>;
}
