'use client';
import {useState} from 'react';
import {Armchair,BookOpen,Headphones} from 'lucide-react';
import styles from '@/app/about/about.module.css';
type Props={photo:string;alt:string;kind:'books'|'furniture'|'electronics';priority?:boolean};
export default function AboutPhoto({photo,alt,kind,priority=false}:Props){
 const [failed,setFailed]=useState(false);const Icon=kind==='books'?BookOpen:kind==='furniture'?Armchair:Headphones;
 return <div className={`${styles.photo} ${styles[kind]}`} data-about-photo={kind}>{failed?<div className={styles.photoFallback} role="img" aria-label={kind==='books'?'Books illustration: stories worth passing on':kind==='furniture'?'Furniture illustration: a place in another home':'Electronics illustration: more life in everyday things'}><Icon size={52} strokeWidth={1.3} aria-hidden="true"/><span>{kind==='books'?'Stories worth passing on':kind==='furniture'?'A place in another home':'More life in everyday things'}</span></div>:
 // These are editorial photos for About, never substitutes for seller listing photos.
 // eslint-disable-next-line @next/next/no-img-element
 <img src={`https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=${priority?900:600}&q=80`} alt={alt} width={priority?900:600} height={priority?720:450} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>}</div>;
}
