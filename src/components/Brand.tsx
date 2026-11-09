import Link from 'next/link';
import { Recycle } from 'lucide-react';
export default function Brand({ light = false }: { light?: boolean }) {
 return <Link href="/" className={`brand ${light ? 'brand-light' : ''}`} aria-label="ReUse Market home">
  <span className="brand-mark"><Recycle size={23} strokeWidth={2.8} /></span>
  <span className="brand-text">reuse<span>.</span></span>
 </Link>;
}
