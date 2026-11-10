'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {Bell} from 'lucide-react';
import {useAuth} from './AuthProvider';
import {api} from '@/lib/client';
export function refreshNotifications(){window.dispatchEvent(new Event('reuse-notifications-changed'));}
export default function NotificationLink({mobile=false}:{mobile?:boolean}){
 const {user}=useAuth();const [unread,setUnread]=useState(0);
 useEffect(()=>{let active=true;if(!user)return;async function load(){if(document.visibilityState==='hidden')return;try{const data=await api<{unread:number}>('/api/notifications');if(active)setUnread(data.unread);}catch{/* The notifications page displays errors with retry. */}}void load();const timer=setInterval(()=>void load(),30000);const listener=()=>void load();window.addEventListener('reuse-notifications-changed',listener);document.addEventListener('visibilitychange',listener);return()=>{active=false;clearInterval(timer);window.removeEventListener('reuse-notifications-changed',listener);document.removeEventListener('visibilitychange',listener);};},[user]);
 if(!user)return null;return <Link href="/notifications" className={mobile?'inbox-nav-mobile':'icon-btn inbox-nav'} aria-label={`Notifications${unread?`, ${unread} unread`:''}`} title="Notifications"><Bell size={20}/>{mobile&&'Notifications'}{unread>0&&<span className="unread-badge" aria-hidden="true">{unread>99?'99+':unread}</span>}</Link>;
}
