import Link from 'next/link';
import { ArrowUpRight, Heart, Leaf, Mail } from 'lucide-react';
import Brand from './Brand';
export default function SiteFooter() {
 return <footer className="site-footer"><div className="container footer-top">
  <div className="footer-about"><Brand light/><p>Good things deserve a second story. Buy, sell, and make more of what already exists.</p><span className="footer-impact"><Leaf size={16}/> Made for a more circular future</span></div>
  <div className="footer-links"><h4>Explore</h4><Link href="/marketplace">All listings <ArrowUpRight size={14}/></Link><Link href="/marketplace?category=Clothing">Clothing</Link><Link href="/marketplace?category=Electronics">Electronics</Link><Link href="/marketplace?category=Books">Books</Link></div>
  <div className="footer-links"><h4>Get involved</h4><Link href="/sell">Sell an item</Link><Link href="/dashboard">My dashboard</Link><Link href="/how-it-works">Help centre</Link><Link href="/about">About & mission</Link></div>
  <div className="footer-note"><div className="footer-note-icon"><Mail size={22}/></div><h4>Have something to pass on?</h4><p>Someone in your community could give it a new home.</p><Link href="/sell">Start selling <ArrowUpRight size={16}/></Link></div>
 </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} ReUse Market. Reuse more. Waste less.</span><span>Built with <Heart size={13} fill="currentColor"/> for communities</span></div></footer>;
}
