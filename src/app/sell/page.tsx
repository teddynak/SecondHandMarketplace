'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import ListingForm from '@/components/ListingForm';
export default function SellPage() {
 const { user,ready } = useAuth();
 if (!ready) return <div className="container page-loading">Checking your account...</div>;
 if (!user) return <div className="container auth-required"><h1>Ready to give something a new home?</h1><p>Create an account or log in to start listing your items.</p><div className="btn-row"><Link className="btn btn-primary" href="/register?next=%2Fsell">Create account</Link><Link className="btn btn-outline" href="/login?next=%2Fsell">Log in</Link></div></div>;
 return <div className="form-page"><div className="container form-page-container"><Link className="back-link" href="/dashboard"><ArrowLeft size={17}/> Back to dashboard</Link><div className="form-page-heading"><span className="section-kicker">PASS SOMETHING ON</span><h1>List something lovely<span className="accent-dot">.</span></h1><p>It only takes a few minutes to give your item a second story.</p></div><ListingForm key={user.id}/></div></div>;
}
