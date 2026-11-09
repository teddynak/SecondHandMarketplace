'use client';
import { useState } from 'react';
import { Recycle } from 'lucide-react';
function Photo({ src, alt, className }: {src:string;alt:string;className:string}) {
 const [failed,setFailed] = useState(false);
 if (failed) return <Fallback className={className} label="Image unavailable"/>;
 // External image links load in the browser; the server never fetches user-supplied URLs.
 // eslint-disable-next-line @next/next/no-img-element
 return <img src={src} alt={alt} className={className} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>;
}
function Fallback({className,label}:{className:string;label:string}) {
 return <div className={`image-fallback ${className}`} role="img" aria-label={label}><span><Recycle size={32}/></span><small>{label === 'Image unavailable' ? label : 'Ready for a new home'}</small></div>;
}
export default function ProductImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
 return src ? <Photo key={src} src={src} alt={alt} className={className}/> : <Fallback className={className} label="No product image"/>;
}
