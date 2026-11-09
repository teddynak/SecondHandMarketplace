import Link from 'next/link';
import { ArrowLeft, Recycle } from 'lucide-react';
export default function NotFound(){return <div className="container not-found"><Recycle size={56}/><h1>That page has moved on.</h1><p>We couldn’t find the page you’re looking for. Let’s find you something else worth keeping.</p><Link className="btn btn-primary" href="/"><ArrowLeft size={18}/> Back to home</Link></div>;}
