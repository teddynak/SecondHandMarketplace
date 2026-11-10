'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef,useState } from 'react';
import { ArrowRight, Heart, LayoutDashboard, LogOut, Menu, Plus, ShieldCheck, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { api, initials } from '@/lib/client';
import Brand from './Brand';
export default function SiteHeader() {
 const menuRef=useRef<HTMLButtonElement>(null);
 const pathname = usePathname(); const router = useRouter();
 const { user, ready, refresh } = useAuth(); const [open, setOpen] = useState(false);
 const navClass = (path: string) => `nav-link ${pathname === path ? 'nav-active' : ''}`;
 async function logout() {
  try { await api('/api/auth/logout', { method: 'POST' }); await refresh(); setOpen(false); toast.success('You have signed out.'); router.push('/'); router.refresh(); }
  catch (e) { toast.error((e as Error).message); }
 }
 return <header className="site-header"><div className="container header-content">
  <Brand />
  <nav className="desktop-nav" aria-label="Primary navigation">
   <Link href="/marketplace" className={navClass('/marketplace')}>Explore marketplace</Link>
   <Link href="/how-it-works" className={navClass('/how-it-works')}>Help centre</Link>
   <Link href="/about" className={navClass('/about')}>About & mission</Link>
  </nav>
  <div className="header-actions desktop-actions"><Link href="/saved" className="icon-btn" aria-label="Saved items" title="Saved items"><Heart size={20}/></Link>
   {user ? <>
     <Link className="header-profile" href="/dashboard" title="Your dashboard"><span className="avatar avatar-small">{initials(user.name)}</span><span className="hide-small">My dashboard</span></Link>
     {user.role === 'admin' && <Link href="/admin" className="icon-btn" title="Admin dashboard" aria-label="Admin dashboard"><ShieldCheck size={20}/></Link>}
     <button className="icon-btn" onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={19}/></button>
    </> : ready && <Link href="/login" className="nav-login">Log in <ArrowRight size={15}/></Link>}
   <Link href="/sell" className="btn btn-primary btn-small"><Plus size={17}/> Sell an item</Link>
  </div>
  <button ref={menuRef} className="mobile-menu-toggle" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(v => !v)}>{open ? <X/> : <Menu/>}</button>
 </div>
 {open && <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation" onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);menuRef.current?.focus();}}} onClick={() => setOpen(false)}>
  <Link href="/marketplace">Explore marketplace</Link><Link href="/saved"><Heart size={18}/> Saved items & searches</Link><Link href="/how-it-works">Help centre</Link><Link href="/about">About & mission</Link>
  {user ? <><Link href="/dashboard"><LayoutDashboard size={18}/> My dashboard</Link>{user.role === 'admin' && <Link href="/admin"><ShieldCheck size={18}/> Admin dashboard</Link>}
  <button onClick={(event) => { event.stopPropagation(); void logout(); }}><LogOut size={18}/> Sign out</button></> : <><Link href="/login"><UserRound size={18}/> Log in</Link><Link href="/register">Create account</Link></>}
  <Link className="btn btn-primary" href="/sell"><Plus size={18}/> Sell an item</Link>
 </nav>}
 </header>;
}
