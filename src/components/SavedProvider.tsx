'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import { api } from '@/lib/client';
type Value={ids:string[];ready:boolean;pending:string[];error:string;reload:()=>void;toggle:(id:string)=>Promise<void>};
const Context=createContext<Value>({ids:[],ready:false,pending:[],error:'',reload:()=>{},toggle:async()=>{}});
export function SavedProvider({children}:{children:React.ReactNode}){
 const {user}=useAuth();const router=useRouter();const pathname=usePathname();
 const userId=user?.id;const [retry,setRetry]=useState(0);
 const [snapshot,setSnapshot]=useState<{owner:string;ids:string[];error?:string}>({owner:'',ids:[]});const [pending,setPending]=useState<string[]>([]);const locks=useRef(new Set<string>());
 useEffect(()=>{let active=true;if(userId)api<{ids:string[]}>('/api/favorites').then(data=>{if(active)setSnapshot({owner:userId,ids:data.ids});}).catch(error=>{if(active)setSnapshot({owner:userId,ids:[],error:error.message});});return()=>{active=false;};},[userId,retry]);
 const ids=user&&snapshot.owner===user.id?snapshot.ids:[];
 async function toggle(id:string){
  if(!user){router.push(`/login?next=${encodeURIComponent(pathname+window.location.search)}`);return;}
  if(locks.current.has(id))return;locks.current.add(id);setPending(values=>[...values,id]);
  try{const saved=ids.includes(id);await api('/api/favorites',{method:saved?'DELETE':'POST',body:JSON.stringify({productId:id})});setSnapshot(previous=>{const current=previous.owner===user.id?previous.ids:[];return {owner:user.id,ids:saved?current.filter(value=>value!==id):[...new Set([...current,id])]};});toast.success(saved?'Removed from saved items.':'Saved to your collection.');}
  catch(error){toast.error((error as Error).message);}finally{locks.current.delete(id);setPending(values=>values.filter(value=>value!==id));}
 }
 return <Context.Provider value={{ids,ready:!user||(snapshot.owner===user.id&&!snapshot.error),pending,error:user&&snapshot.owner===user.id?snapshot.error??'':'',reload:()=>setRetry(value=>value+1),toggle}}>{children}</Context.Provider>;
}
export function useSaved(){return useContext(Context);}
