'use client';
import { useState } from 'react';
/** Decorative editorial photos, never substituted for a seller's item photos. */
export default function CategoryPhoto({photo}:{photo:string}) {
 const [failed,setFailed]=useState(false);
 if(failed)return null;
 // eslint-disable-next-line @next/next/no-img-element
 return <img className="category-photo" src={`https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=480&h=320&q=75`} alt="" width={480} height={320} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>;
}
