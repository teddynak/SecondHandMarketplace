import { Recycle } from 'lucide-react';
export default function ProductImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
 if (!src) return <div className={`image-fallback ${className}`} aria-label="No product image"><span><Recycle size={32}/></span><small>Ready for a new home</small></div>;
 // Product photos can be hosted by our own image route.
 // eslint-disable-next-line @next/next/no-img-element
 return <img src={src} alt={alt} className={className} loading="lazy" onError={event => { event.currentTarget.style.opacity = '0.15'; }} />;
}
