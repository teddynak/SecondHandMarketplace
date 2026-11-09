import Link from 'next/link';
export default function Brand({ light = false }: { light?: boolean }) {
 return <Link href="/" className={`brand ${light ? 'brand-light' : ''}`} aria-label="ReUse Market home">
  <span className="brand-mark"><svg className="brand-symbol" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M29 12A12 12 0 0 0 9 19M11 28a12 12 0 0 0 20-7" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/><path d="m23 12 7 1-1-7M17 28l-7-1 1 7" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/><path d="m15 20 4 4 7-8" stroke="#f6b7a0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
  <span className="brand-text">reUse<span>.</span><small>Market</small></span>
 </Link>;
}
