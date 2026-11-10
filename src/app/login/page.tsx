'use client';
import { Suspense, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter,useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Leaf, LoaderCircle, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { api, safeDestination } from '@/lib/client';
import { useAuth } from '@/components/AuthProvider';
import { Notice } from '@/components/Notice';
function LoginForm() {
 const router=useRouter();const search=useSearchParams();const {refresh}=useAuth();
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [visible,setVisible]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const next=search.get('next');const destination=safeDestination(next);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});await refresh();toast.success('Welcome back!');router.replace(destination);router.refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="auth-page"><div className="auth-visual"><div className="auth-visual-top"><Leaf size={25}/> GOOD THINGS DESERVE ANOTHER CHANCE</div><div><div className="auth-illustration">✳</div><h2>Less new.<br/>More <em>you.</em></h2><p>A community where everything has another story waiting to happen.</p></div><span className="auth-visual-footer">ReUse Market · A more circular kind of shopping</span></div><div className="auth-form-side"><div className="auth-panel"><span className="section-kicker">NICE TO SEE YOU AGAIN</span><h1>Welcome back<span className="accent-dot">.</span></h1><p>Sign in to discover more, or keep your listings moving.</p>{error&&<Notice message={error}/>}<form onSubmit={submit}><div className="form-field"><label htmlFor="login-email">Email address</label><div className="input-icon"><Mail size={18}/><input id="login-email" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></div><div className="form-field"><label htmlFor="login-password">Password</label><div className="input-icon"><Lock size={18}/><input id="login-password" type={visible?'text':'password'} required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" aria-label={visible?'Hide password':'Show password'} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div><button className="btn btn-primary btn-block auth-submit" type="submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:<>Sign in <ArrowRight size={18}/></>}</button></form><Link className="forgot-password-link" href="/forgot-password">Forgot your password?</Link><p className="auth-switch">New around here? <Link href={`/register${next?`?next=${encodeURIComponent(destination)}`:''}`}>Create your account</Link></p></div></div></div>;
}
export default function LoginPage(){return <Suspense fallback={<div className="container page-loading">Loading...</div>}><LoginForm/></Suspense>;}
