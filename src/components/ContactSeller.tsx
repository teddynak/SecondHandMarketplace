'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {MessageCircle} from 'lucide-react';
import {useAuth} from './AuthProvider';
import {api} from '@/lib/client';
export default function ContactSeller({listingId,sellerId}:{listingId:string;sellerId:string}){
 const {user,ready}=useAuth();const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function start(){if(busy)return;setBusy(true);setError('');try{const data=await api<{conversation:{id:string}}>('/api/conversations',{method:'POST',body:JSON.stringify({listingId})});router.push(`/inbox/${data.conversation.id}`);}catch(error){setError((error as Error).message);setBusy(false);}}
 if(!ready)return <p role="status">Checking messaging access…</p>;
 if(user?.id===sellerId)return <Link className="btn btn-primary btn-block" href="/inbox"><MessageCircle size={18}/> View buyer messages</Link>;
 return <div className="contact-in-app">{user?<button className="btn btn-primary btn-block" disabled={busy} onClick={()=>void start()}><MessageCircle size={18}/>{busy?'Opening conversation…':'Message on ReUse'}</button>:<Link className="btn btn-primary btn-block" href={`/login?next=${encodeURIComponent(`/items/${listingId}`)}`}><MessageCircle size={18}/> Log in to message seller</Link>}{error&&<p className="form-error" role="alert">{error}</p>}</div>;
}
